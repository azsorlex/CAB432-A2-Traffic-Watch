FROM node:erbium

COPY . /src

RUN apt-get update && apt-get install -y build-essential unzip cmake git libgtk2.0-dev pkg-config libavcodec-dev libavformat-dev libswscale-dev

# Optional packages for OpenCV
#RUN apt-get install -y python-dev python-numpy libtbb2 libtbb-dev libjpeg-dev libpng-dev libtiff-dev libjasper-dev libdc1394-22-dev

RUN wget -O temp.zip https://github.com/opencv/opencv/archive/4.4.0.zip

RUN unzip temp.zip && rm temp.zip && mv opencv* opencv

# Create the build folder and set it to be the current directory
WORKDIR /opencv/build

RUN cmake -D CMAKE_BUILD_TYPE=Release -D CMAKE_INSTALL_PREFIX=/usr/local ..

# Run 8 jobs in parallel
RUN make -j8

RUN make install

WORKDIR /src

RUN npm install

EXPOSE 3000

CMD ["npm", "start"]