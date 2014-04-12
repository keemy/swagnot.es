.PHONY: help build debug server all subperseus put put-js put-css update clean lint
PORT=9000

build:
	./node_modules/.bin/browserify index.js -t [ reactify --es6 ] > compiled.js

deploy:
		./node_modules/.bin/browserify ./index.js -t [ reactify --es6 ] -d > compiled.js
		scp -r compiled.js style.css login_success.html lib la:~/server/public
