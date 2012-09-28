call "C:\Program Files\nodejs\nodejsvars.bat"
node r.js -o ngeo.build.js
lessc --yui-compress ..\css\main.less > main.css
pause