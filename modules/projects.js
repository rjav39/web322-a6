require('dotenv').config();
require('pg'); // explicitly require the "pg" module
const Sequelize = require('sequelize');


// set up sequelize to point to our postgres database
const sequelize = new Sequelize(process.env.PGDATABASE, process.env.PGUSER, process.env.PGPASSWORD, {
  host: process.env.PGHOST,
  dialect: 'postgres',
  port: 5432,
  dialectOptions: {
    ssl: { rejectUnauthorized: false },
  },
});

const Sector = sequelize.define(
  'Sector',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true, // use "id" as a primary key
      autoIncrement: true, // automatically increment the value

    },
    sector_name: Sequelize.STRING,
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);

// Project model

const Project = sequelize.define(
  'Project',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true, // use "set_num" as a primary key
      autoIncrement: true
    },
    title: Sequelize.STRING,
    feature_img_url: Sequelize.STRING,
    summary_short: Sequelize.TEXT,
    intro_short: Sequelize.TEXT,
    impact: Sequelize.TEXT,
    original_source_url: Sequelize.STRING
  },
  {
    createdAt: false, // disable createdAt
    updatedAt: false, // disable updatedAt
  }
);


Project.belongsTo(Sector, { foreignKey: 'sector_id' });


function initialize() {
  return new Promise(async (resolve, reject) => {
    try {
      await sequelize.sync();
      resolve();
    } catch (err) {
      reject(err.message)
    }
  });

}

function getAllProjects() {
  return new Promise(async (resolve, reject) => {
    try {
      let projects = await Project.findAll({ include: [Sector] });
      resolve(projects);
    } catch (err) {
      reject(err);
    }
  });
}

function getProjectById(projectId) {

  return new Promise(async (resolve, reject) => {

    try {
      let foundProject = await Project.findAll({ include: [Sector], where: { id: projectId } });

      if (foundProject.length > 0) {
        resolve(foundProject[0]);
      } else {
        reject("Unable to find requested project");
      }
    } catch (err) {
      reject(err)
    }
  });

}

function getProjectsBySector(sector) {

  return new Promise(async (resolve, reject) => {
    try{
      let foundProjects = await Project.findAll({
        include: [Sector], where: {
          '$Sector.sector_name$': {
            [Sequelize.Op.iLike]: `%${sector}%`
          }
        }
      });
  
      if (foundProjects.length > 0) {
        resolve(foundProjects);
      } else {
        reject("Unable to find requested projects");
      }
    }catch(err){
      reject(err)
    }
  });

}

function addProject(projectData) {
  return new Promise(async (resolve, reject) => {
    try {
      await Project.create(projectData);
      resolve();
    } catch (err) {
      reject(err.errors[0].message)
    }
  });
}

function editProject(id, projectData) {
  return new Promise(async (resolve, reject) => {
    try {
      await Project.update(projectData, { where: { id: id } })
      resolve();
    } catch (err) {
      console.log(err);
      reject(err.errors[0].message);
    }
  });
}

function deleteProject(id) {
  return new Promise(async (resolve, reject) => {
    try {
      await Project.destroy({
        where: { id: id }
      });
      resolve();
    } catch (err) {
      reject(err.errors[0].message);
    }

  });

}

function getAllSectors() {

  return new Promise(async (resolve, reject) => {
    try{
      let sectors = await Sector.findAll();
      resolve(sectors);
    }catch(err){
      reject(err);
    }
    
  });

}


module.exports = { initialize, getAllProjects, getProjectById, getProjectsBySector, getAllSectors, addProject, editProject, deleteProject }

// const projectData = require("../data/projectData");
// const sectorData = require("../data/sectorData");


// sequelize
// .sync()
// .then( async () => {
//   try{
//     await Sector.bulkCreate(sectorData); 
//     await Project.bulkCreate(projectData);

//     await sequelize.query(`SELECT setval(pg_get_serial_sequence('"Sectors"', 'id'), (SELECT MAX(id) FROM "Sectors"))`);
//     await sequelize.query(`SELECT setval(pg_get_serial_sequence('"Projects"', 'id'), (SELECT MAX(id) FROM "Projects"))`);

//     console.log("-----");
//     console.log("data inserted successfully");
//   }catch(err){
//     console.log("-----");
//     console.log(err.message);

//     // NOTE: If you receive the error:

//     // insert or update on table "Projects" violates foreign key constraint "Projects_sector_id_fkey"
//     // it is because you have a "project" in your collection that has a "sector_id" that does not exist in "sectorData".   
//     // To fix this, use PgAdmin to delete the newly created "Sectors" and "Projects" tables, fix the error in your .json files and re-run this code
//   }

//   process.exit();
// })
// .catch((err) => {
//   console.log('Unable to connect to the database:', err);
// });
