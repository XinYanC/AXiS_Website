# Swapify Makefile
# Run from swapify/ directory.

FORCE:

# install dependencies
install:
	npm install

# start the dev server (http://localhost:5173)
# run cloud.sh or local.sh to set the environment variables
dev:
	npm install
	npm run dev

# build (dist/)
build:
	npm run build

# run ESLint
lint:
	npm run lint

# run tests (currently placeholder; see package.json "test" script)
test:
	npm run test

# prod: lint, test, build, then commit & push
prod: lint test build github

# commit & push to main branch
github: FORCE
	- git commit -a
	git push origin main

# remove node_modules and dist
clean:
	rm -rf node_modules dist
