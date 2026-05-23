#!/bin/sh
cd "$(dirname "$0")/../frontend"
npx vite build --watch
