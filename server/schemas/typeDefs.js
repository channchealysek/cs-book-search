const { gql } = require("apollo-server-express");

module.exports = gql`
  type Query {
    me: User
  }

  input RegisterInput {
    username: String!
    email: String!
    password: String!
  }

  input BookInput {
    authors: [String]
    description: String!
    bookId: String!
    image: String
    link: String
    title: String!
  }

  type User {
    _id: ID!
    username: String!
    email: String!
    bookCount: Int
    saveBooks: [Book]
  }

  type Mutation {
    login(email: String!, password: String!): Auth!
    register(registerInput: RegisterInput): Auth!
    saveBook(bookData: BookInput!): User
    removeBook(bookId: ID!): User
  }

  type Book {
    bookId: ID!
    authors: [String]
    description: String
    image: String
    link: String
    title: String!
  }

  type Auth {
    token: ID!
    user: User
  }
`;
