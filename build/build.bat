call "C:\Program Files\nodejs\nodejsvars.bat"
node r.js -o ngeo.build.js
node postProcessor.js
lessc --yui-compress ..\client\css\main.less > output\css\main.css
