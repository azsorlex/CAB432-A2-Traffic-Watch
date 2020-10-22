FROM node

COPY . /src
WORKDIR /src/routes

# Each one of the following lines except the first comments out a line of code and uncomments the one after it
RUN sed -i '24s/^/\/\//;25s/^..//;26s/^..//' tensorflow.js
RUN sed -i '28s/^/\/\//;29s/^..//' tensorflow.js
RUN sed -i '17s/^  /  \/\//;18s/^  ../  /' index.js
RUN sed -i '46s/^  /  \/\//;47s/^  ../  /' index.js

WORKDIR /src
RUN npm i

EXPOSE 3000
CMD ["npm", "start"]