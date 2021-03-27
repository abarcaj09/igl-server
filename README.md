# IGL-SERVER

IGL-SERVER is a RESTful API for the soon to be created IGL client. The server will handle requests made by the client such as: the creation/deletion of posts, following/unfollowing of users, creation/deletion of comments, etc. Requests can be made to the deployed version of this server at https://igl-server.herokuapp.com.

### Built With

- [MongoDB](https://www.mongodb.com)
- [Express](https://expressjs.com)
- [Node.js](https://nodejs.org)

### Prerequisites

- [Cloudinary](https://cloudinary.com/) To store uploaded images.

- [MongoDB](https://www.mongodb.com) Database to store everything the server needs.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Installation

1. Clone the repo

```sh
git clone https://github.com/abarcaj09/igl-server.git
```

2. Install dependencies

```sh
npm install
```

### Environment Variables

To run all of the scripts, the following environment variables will need to be defined in a .env file.

- `MONGODB_URI`: Connection string to access your Mongo database.
- `TEST_MONGODB_URI`: A separate connection string to access your Mongo database for testing purposes.
- `JWT_SECRET`: The secret key for your JSON web tokens.
- `CLOUDINARY_NAME`: Obtain from cloudinary.com. Used to connect to your cloudinary account to store images.
- `CLOUDINARY_API_KEY`: Obtain from cloudinary.com. Used to connect to your cloudinary account to store images.
- `CLOUDINARY_API_SECRET`: Obtain from cloudinary.com. Used to connect to your cloudinary account to store images.

## Scripts

1. To run in development mode

```sh
npm run dev
```

2. To run production mode

```sh
npm start
```

3. To run tests

```sh
npm test
```

## Authors

- **Juan Abarca** - [abarcaj09](https://github.com/abarcaj09)

## Contact

Juan Abarca - abarcaj277@gmail.com
