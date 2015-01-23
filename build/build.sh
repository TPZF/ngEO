node r.js -o build.js
node postProcessor.js
lessc --compress ../client/css/main.less > output/css/main.css
lessc --compress ../client/css/home.less > output/css/home.css
lessc --compress ../client/css/help.less > output/css/help.css
find output -iname ".svn" -print0 | xargs -0 rm -r

