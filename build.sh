#!/usr/bin/env bash
set -e

REMOTE_USER="ilsc"
REMOTE_HOST="dm.insightplm.in"
REMOTE_PATH="~/prj/"
EXCLUDES_FILE="exclude.txt"

LOCAL_DIST_DIR="dist"

# 1. Sync files to remote using rsync
rsync -az --exclude-from="$EXCLUDES_FILE" --delete --progress . "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"

# 2. Run remote build steps over SSH
ssh ${REMOTE_USER}@${REMOTE_HOST} <<'EOF'
  set -e
  cd ~/prj

  # Run pyinstaller inside container
  docker run -it --rm -v "$(pwd)":/app pyinstaller-368 bash -c "
      cd /app
      /usr/local/bin/python3.6 -m pip install -r requirements.txt
      /usr/local/bin/pyinstaller --onefile --name proteus --add-data "static:static" app.py
  "
EOF

# 3. Copy artifacts back
mkdir -p "${LOCAL_DIST_DIR}"
scp -r "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/dist/proteus" "${LOCAL_DIST_DIR}/"
echo "Done."