# Swapify Makefile
# Run from swapify/ directory.

# install dependencies
install:
	npm install

# start the dev server (http://localhost:5173)
dev:
	npm run dev

# dev server pointing at local backend (127.0.0.1:8000)
dev-local:
	npm run dev:local

# dev server pointing at cloud backend (xinyanc.pythonanywhere.com)
dev-cloud:
	npm run dev:cloud

# prod build (dist/)
build:
	npm run build

# prod build using local backend (127.0.0.1:8000)
build-local:
	npm run build:local

# prod build using cloud backend (xinyanc.pythonanywhere.com)
build-cloud:
	npm run build:cloud

# run ESLint
lint:
	npm run lint

# remove node_modules and dist
clean:
	rm -rf node_modules dist
