#!/bin/bash -xe

(cd "$(dirname "$0")/../docs" ; markdownlint -c ../.markdownlint.json **/*.md --fix)
