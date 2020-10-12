FROM node

COPY . /opt
WORKDIR /opt

RUN npm i

EXPOSE 3000
CMD ["npm", "start"]