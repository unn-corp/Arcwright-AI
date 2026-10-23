"""Exercise the real scanner: historical nonsecrets pass; credential shapes fail."""
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
SCANNER = str(Path(sys.argv[1]).resolve())
CONFIG = str(Path(sys.argv[2]).resolve()) if len(sys.argv) > 2 else str(ROOT / '.gitleaks.toml')
# Independent public fixtures from the original historical evidence, retained
# locally so deleting an unrelated remote branch cannot break this regression.
fixtures = json.loads((ROOT / '.github/gitleaks-fixtures.json').read_text())
manifest = 'docs/skill-sources.json'
checksums = fixtures['checksums']
aurora = '.agents/skills/aurora-db-best-practices/'
prose = fixtures['prose']
benign = {manifest: '\n'.join(checksums), aurora + 'SKILL.md': prose, aurora + 'guide-13-review-output.md': prose}


def scan(files, expected_exit):
    with tempfile.TemporaryDirectory(prefix='arcwright-gitleaks-test-', dir=os.environ['RUNNER_TEMP']) as tmp:
        source = Path(tmp) / 'source'
        source.mkdir()
        for name, content in files.items():
            target = source / name
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content + '\n')
        report = Path(tmp) / 'report.json'
        result = subprocess.run(
            [SCANNER, 'detect', '--no-git', '--source=.', '--config=' + CONFIG,
             '--redact=100', '--no-banner', '--exit-code=1', '--report-format=json', '--report-path=' + str(report)],
            capture_output=True, text=True, cwd=source,
        )
        assert result.returncode == expected_exit, f'expected exit {expected_exit}, got {result.returncode}'
        findings = json.loads(report.read_text())
        assert all(f['Secret'] == 'REDACTED' for f in findings), 'report exposed a value'
        return findings


assert scan(benign, 0) == [], 'verified checksum/prose fixtures must pass'

# Credential-shaped substitutes in every formerly flagged checksum field must
# still fail, including a 64-hex API credential in that exact JSON/path shape.
changed = []
for index, line in enumerate(checksums):
    token = hashlib.sha256(('independent-credential-fixture-' + str(index)).encode()).hexdigest()
    changed.append(re.sub(r'[a-f0-9]{64}', token, line))
findings = scan({manifest: '\n'.join(changed)}, 1)
assert len(findings) == 13 and all(f['RuleID'] == 'generic-api-key' for f in findings)

# Real credential formats are synthetic and never sent to a provider. Put them
# in both prose paths and alongside an approved checksum, on the same line.
token = 'ghp_' + hashlib.sha256(b'independent-github-fixture').hexdigest()[:36]
findings = scan({
    manifest: checksums[0] + ' token = "' + token + '"',
    aurora + 'SKILL.md': prose + '\napi_key = "' + token + '"',
    aurora + 'guide-13-review-output.md': prose + '\napi_key = "' + token + '"',
}, 1)
assert len({f['File'] for f in findings}) == 3
assert any(f['RuleID'] == 'github-pat' for f in findings), 'provider-specific rule must remain active'

# Content is also insufficient by itself: the exact same digests elsewhere
# remain subject to the generic rule (no global hex/token exemption).
assert len(scan({'elsewhere.json': '\n'.join(checksums)}, 1)) == 13
print('PASS: 15 historical nonsecrets; 13 changed values; 3 credential locations; exact-path control; redaction')
