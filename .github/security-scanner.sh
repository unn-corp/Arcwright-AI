#!/usr/bin/env bash
# Job-local scanners: preserve upstream rules while patching their Go runtime.
set -euo pipefail
SCANNER=${1:?scanner name required}
SCAN_DIR=${2:?private scanner directory required}
test -d "$SCAN_DIR"
test -z "$(ls -A "$SCAN_DIR")"

fetch() {
  curl --proto '=https' --tlsv1.2 -sSfL "$1" -o "$2"
  printf '%s  %s\n' "$3" "$2" | sha256sum -c -
}

# A private toolchain, never setup-go, PATH modification, or a host Go install.
fetch https://go.dev/dl/go1.27.3.linux-amd64.tar.gz "$SCAN_DIR/go.tar.gz" \
  65efbc80fdc1fa2cd2631cad5b481777a68e8725f34e89f50fc6ac714e379b40
tar --no-same-owner -xzf "$SCAN_DIR/go.tar.gz" -C "$SCAN_DIR"
export GOROOT="$SCAN_DIR/go" GOTOOLCHAIN=local GOENV=off GOTELEMETRY=off
export GOPATH="$SCAN_DIR/gopath" GOMODCACHE="$SCAN_DIR/modules" GOCACHE="$SCAN_DIR/cache"
export GOPROXY=https://proxy.golang.org GOSUMDB=sum.golang.org GOPRIVATE= GONOSUMDB= GONOPROXY=
export CGO_ENABLED=0 GOOS=linux GOARCH=amd64 GOAMD64=v1 GOMAXPROCS=2 GOFLAGS=
"$GOROOT/bin/go" version | grep -Fx 'go version go1.27.3 linux/amd64'

# Only this private cache is writable, so the caller's EXIT trap can remove
# downloaded modules as the runner user. go.sum/sumdb verification is unchanged.

case "$SCANNER" in
  gitleaks)
    # Same reviewed 8.30.1 source/rules and upstream gore2regex release tag.
    fetch https://codeload.github.com/gitleaks/gitleaks/tar.gz/83d9cd684c87d95d656c1458ef04895a7f1cbd8e \
      "$SCAN_DIR/source.tar.gz" 6b2638a733b85619dc80bdf28e84e4fed7e526a761ab5c148fbf67695aea2115
    mkdir "$SCAN_DIR/source"
    tar --no-same-owner -xzf "$SCAN_DIR/source.tar.gz" --strip-components=1 -C "$SCAN_DIR/source"
    (cd "$SCAN_DIR/source" && "$GOROOT/bin/go" build -p=2 -mod=readonly -modcacherw -trimpath -buildvcs=false \
      -tags=gore2regex -ldflags='-s -w -X=github.com/zricethezav/gitleaks/v8/version.Version=8.30.1' \
      -o "$SCAN_DIR/gitleaks" .)
    ;;
  osv-scanner)
    # Maintained compatible v2 release; original scan source/recursive policy.
    fetch https://codeload.github.com/google/osv-scanner/tar.gz/bfe2f84abd2f09fe0b83ba7f6dad40d296762f40 \
      "$SCAN_DIR/source.tar.gz" 31be5bf5420939c0b9f3051a4eed24360c4346dda7ce6d962a9459cb0567c32f
    mkdir "$SCAN_DIR/source"
    tar --no-same-owner -xzf "$SCAN_DIR/source.tar.gz" --strip-components=1 -C "$SCAN_DIR/source"
    (cd "$SCAN_DIR/source" && "$GOROOT/bin/go" build -p=2 -mod=readonly -modcacherw -trimpath -buildvcs=false \
      -ldflags='-s -w -X github.com/google/osv-scanner/v2/internal/version.OSVVersion=2.7.0' \
      -o "$SCAN_DIR/osv-scanner" ./cmd/osv-scanner/)
    ;;
  trivy)
    fetch https://github.com/aquasecurity/trivy/releases/download/v0.76.1/trivy_0.76.1_Linux-64bit.tar.gz \
      "$SCAN_DIR/trivy.tar.gz" c7cbe3137fb8a48a17574bede3dd6beb16742d1e9772929940fc90082c39d9c0
    tar --no-same-owner -xzf "$SCAN_DIR/trivy.tar.gz" -C "$SCAN_DIR" trivy
    ;;
  *) printf 'Unsupported scanner: %s\n' "$SCANNER" >&2; exit 1 ;;
esac

# Pinning a release name alone does not verify its embedded runtime.
"$GOROOT/bin/go" version -m "$SCAN_DIR/$SCANNER" > "$SCAN_DIR/buildinfo.txt"
head -n 1 "$SCAN_DIR/buildinfo.txt" | grep -E ': go1\.27\.3$'
grep -F 'CGO_ENABLED=0' "$SCAN_DIR/buildinfo.txt"
