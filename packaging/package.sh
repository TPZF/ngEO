# Build the WebClient first : minificaiton, combination
cd ../build
./build.sh

# Build the tar from the optimized sources
cd ../packaging
mkdir esa-webclient-ngeo
mv ../build/output ./esa-webclient-ngeo/webclient
tar czf esa-webclient-ngeo.tar.gz esa-webclient-ngeo
rm -rf esa-webclient-ngeo
mv esa-webclient-ngeo.tar.gz ~/rpmbuild/SOURCES

# Build the rpm
rpmbuild -ba esa-webclient-ngeo.spec

# Build the tar from the server
cd ../packaging
mkdir esa-webclient-testserver-ngeo
cp -r ../stub_server ./esa-webclient-testserver-ngeo/webclient-testserver
tar czf esa-webclient-testserver-ngeo.tar.gz esa-webclient-testserver-ngeo
rm -rf esa-webclient-testserver-ngeo
mv esa-webclient-testserver-ngeo.tar.gz ~/rpmbuild/SOURCES

# Build the rpm
rpmbuild -ba esa-webclient-testserver-ngeo.spec


