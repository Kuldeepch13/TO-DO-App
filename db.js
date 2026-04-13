import { Sequelize, DataTypes } from "sequelize";

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: "mysql",
    }
);


//user model
const User = sequelize.define("USer", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey : true,
        autoIncrement: true,
    }, 
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    password:{
        type: DataTypes.STRING,
        allowNull: false,
    },
});


//TODO MODEL

const Todo = sequelize.define("TODO", {
    id: {
        type : DataTypes.INTEGER,
        primaryKey : true,
        autoIncrement: true,
    },

    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },

    description: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
});


//Relationship

User.hasMany(Todo, {foreignKey: "userId"});
Todo.belongsTo(User, {foreignKey: "userId"});


const syncDB = async () =>{
    await sequelize.sync();
    console.log("Database connected and Tables created.");
}

export{User, Todo, syncDB}; 