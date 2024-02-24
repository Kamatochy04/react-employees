const { prisma } = require("../prisma/prisma-client");
const brypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Пожалуйста заполните поля" });
  }

  const user = await prisma.user.findFirst({
    where: {
      email,
    },
  });

  const isPasswordCorrect =
    user && (await brypt.compare(password, user.password));

  const secret = process.env.JWT_SECRET;

  if (user && isPasswordCorrect && secret) {
    res.status(200).json({
      id: user.id,
      email: user.email,
      name: user.name,
      token: jwt.sign({ id: user.id }, secret, { expiresIn: "30d" }),
    });
  } else {
    return res
      .status(400)
      .json({ message: " неверно введен логин или пароль" });
  }
};

/**
 *
 *  @route POST api/user/registers
 *  @description register
 * */
const register = async (req, res, next) => {
  const { email, password, name } = req.body;

  try {
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Пожалуйста заполните обязательные поля" });
    }
    const registerUser = await prisma.user.findFirst({
      where: {
        email,
      },
    });
    if (registerUser) {
      return res
        .status(400)
        .json({ message: "Пользователь с таким email уже существует" });
    }
    const salt = await brypt.genSalt(10);
    const hashedPassword = await brypt.hash(password, salt);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
      },
    });
    const secret = process.env.JWT_SECRET;
    if (user && secret) {
      res.status(201).json({
        id: user.id,
        email: user.email,
        name,
        token: jwt.sign({ id: user.id }, secret, { expiresIn: "30d" }),
      });
    } else {
      return res
        .status(400)
        .json({ message: "Не удалось создать пользователя" });
    }
  } catch {
    return res.status(400).json({ message: "что-то пошло не так" });
  }
};

/**
 *  @route GET api/user/current
 *  @description register
 * */

const current = (req, res) => {
  return res.status(200).json(req.user);
};

module.exports = {
  login,
  register,
  current,
};
