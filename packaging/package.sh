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

