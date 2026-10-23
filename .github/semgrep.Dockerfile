# Retain the reviewed scanner and rules while patching its runtime dependencies.
FROM semgrep/semgrep:1.168.0@sha256:59fbed6127ea7c5dde3ba6a85142733bb20ea9aaa36120c953904f1539aaf66e

RUN apk add --no-cache --upgrade 'musl>=1.2.5-r24' 'musl-utils>=1.2.5-r24' \
    'ca-certificates>=20261020-r0' 'ca-certificates-bundle>=20261020-r0' \
    'python3>=3.12.15-r0' 'libcrypto3>=3.5.9-r0' 'libssl3>=3.5.9-r0' \
    'curl>=8.22.0-r0' 'libcurl>=8.22.0-r0' 'c-ares>=1.34.8-r0'

# Keep the system Python managed by Alpine. Overlay the patched dependencies
# in a venv while retaining Semgrep's supported dependency constraints.
RUN python3 -I -m venv --system-site-packages /opt/semgrep-security \
    && PIP_CERT=/etc/ssl/certs/ca-certificates.crt /opt/semgrep-security/bin/python3 -I -m pip install \
        --no-cache-dir --only-binary=:all: \
        'certifi==2026.10.19' 'anyio==4.14.2' 'urllib3==2.8.0' \
    && /opt/semgrep-security/bin/python3 -I -m pip check \
    && printf '#!/bin/sh\nexec /opt/semgrep-security/bin/python3 /usr/bin/semgrep "$@"\n' \
        > /opt/semgrep-security/bin/semgrep \
    && chmod u+x /opt/semgrep-security/bin/semgrep

ENV PATH="/opt/semgrep-security/bin:$PATH"
