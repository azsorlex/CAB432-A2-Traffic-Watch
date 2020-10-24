FROM node

COPY . /src
WORKDIR /src/routes

# Each one of the following lines comments out a line of code and uncomments the one after it
RUN sed -i '19s/^/\/\//;20s/^..//' tensorflow.js
RUN sed -i '34s/^  /  \/\//;35s/^  ../  /' index.js
RUN sed -i '63s/^  /  \/\//;64s/^  ../  /' index.js

WORKDIR /src
RUN npm i

EXPOSE 3000
CMD ["npm", "start"]