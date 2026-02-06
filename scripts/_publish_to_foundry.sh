#!/usr/bin/env bash
set -euo pipefail

package="$1"
token="$2"
tag="$3"

if [ -z "$token" ]; then
    echo "Skipping $package: No API token configured"
    exit 0
fi

manifest_file="_release/$package.json"
if [ ! -f "$manifest_file" ]; then
    echo "Error: Manifest file not found: $manifest_file"
    exit 1
fi

version=$(jq -r '.version' "$manifest_file")
minimum=$(jq -r '.compatibility.minimum // ""' "$manifest_file")
verified=$(jq -r '.compatibility.verified // ""' "$manifest_file")
maximum=$(jq -r '.compatibility.maximum // ""' "$manifest_file")

echo "Publishing $package v$version to Foundry VTT..."

json_body=$(
	cat <<-EOF
		{
		  "id": "$package",
		  "release": {
		    "version": "$version",
		    "manifest": "https://github.com/luanpotter/shattered-wilds/releases/download/$tag/$package.json",
		    "notes": "https://github.com/luanpotter/shattered-wilds/releases/tag/$tag",
		    "compatibility": {
		      "minimum": "$minimum",
		      "verified": "$verified",
		      "maximum": "$maximum"
		    }
		  }
		}
	EOF
)

response=$(
    curl -s -w "\n%{http_code}" -X POST \
    "https://foundryvtt.com/_api/packages/release_version/" \
    -H "Content-Type: application/json" \
    -H "Authorization: $token" \
    -d "$json_body"
)

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✓ Successfully published $package v$version"
else
    echo "✗ Failed to publish $package (HTTP $http_code)"
    echo "$body"
    exit 1
fi
