const {
  AuthenticationError,
  UserInputError,
} = require("apollo-server-express");
const { User } = require("../models");
const { signToken } = require("../utils/auth");
const {
  validateRegisterInput,
  validateLoginInput,
} = require("../utils/validators");

module.exports = {
  Query: {
    me: async (parent, args, context) => {
      if (context.user) {
        try {
          const userData = await User.findOne({ _id: context.user._id }).select(
            "__v -password"
          );
          return userData;
        } catch (err) {
          throw new AuthenticationError("Not logged in");
        }
      }
    },
  },
  Mutation: {
    register: async (_, { registerInput: { username, email, password } }) => {
      // Validate user data
      const { valid, errors } = validateRegisterInput(
        username,
        email,
        password
      );
      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      // Make sure user doesn't already exist
      const user = await User.findOne({ username });
      if (user) {
        throw new UserInputError("Username is taken", {
          errors: {
            username: "This username is taken",
          },
        });
      }

      // hash password and create and auth token
      const newUser = new User({
        username,
        email,
        password,
      });

      const res = await newUser.save();

      const token = signToken({ res });

      return {
        ...res._doc,
        id: res._id,
        username: res.username,
        email: res.email,
        token,
      };
    },
    login: async (_, { email, password }) => {
      const { errors, valid } = validateLoginInput(email, password);

      if (!valid) {
        throw new UserInputError("Errors", { errors });
      }
      const user = await User.findOne({ email });

      if (!user) {
        errors.general = "Email not found.";
        throw new UserInputError("Incorrect credentials", { errors });
      }

      const match = await user.isCorrectPassword(password);

      if (!match) {
        errors.general = "Wrong crendetials.";
        throw new UserInputError("Wrong crendetials", { errors });
      }

      const token = signToken(user);
      return {
        ...user._doc,
        id: user._id,
        username: user.username,
        email: user.email,
        token,
      };
    },
    saveBook: async (parent, { bookData }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $push: { savedBooks: bookData } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("You need to be logged in!");
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError("You need to be logged in!");
    },
  },
};
