FROM node

COPY . /src
WORKDIR /src/routes

# Each one of the following lines comments out a line of code and uncomments the one after it
RUN sed -i '17s/^/\/\//;18s/^..//' tensorflow.js
RUN sed -i '21s/^  /  \/\//;22s/^  ../  /' index.js
RUN sed -i '50s/^  /  \/\//;51s/^  ../  /' index.js

WORKDIR /src
RUN npm i

EXPOSE 3000
CMD ["npm", "start"]