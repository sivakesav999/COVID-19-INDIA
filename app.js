const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

//API 1
app.get("/states/", async (request, response) => {
  const getAllStatesQuery = `SELECT * FROM state ;`;
  const array = await database.all(getAllStatesQuery);
  response.send(array);
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const state = await database.get(getStateQuery);
  response.send(state);
});

// API 3
app.post("/districts/", async (request, response) => {
  const body = request.body;
  const { district_name, state_id, cases, cured, active, deaths } = body;
  const insertQuery = `
  INSERT INTO district 
  (district_name,
     state_id, 
     cases, 
     cured, 
     active,
      deaths) 
  VALUES 
  ('${district_name}',
  ${state_id},
   ${cases},
    ${cured},
     ${active},
      ${deaths} );`;
  await database.run(insertQuery);
  response.send("District Successfully Added");
});

// API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrict = `SELECT * FROM district WHERE district_id = ${districtId};`;
  const district = await database.run(getDistrict);
  response.send(district);
});

//API 5
app.delete(`/districts/:districtId/`, async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  await database.run(deleteQuery);
  response.send("District Removed");
});

//API 6
app.put(`/districts/:districtId/`, async (request, response) => {
  const { district_id } = request.params;
  const body = request.body;
  const { district_name, state_id, cases, cured, active, deaths } = body;
  const updateQuery = `
  UPDATE district 
    SET 
    district_name = '${district_name}',
    state_id = ${state_id},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE
     district_id = ${district_id};
    `;
  await database.run(updateQuery);
  response.send("District Details Updated");
});
//API 7
app.get(`/states/:stateId/stats/`, async (request, response) => {
  const { state_id } = request.params;
  const getStateStats = `SELECT SUM(cases), SUM(cured), SUM(active), SUM(deaths) FROM district 
    WHERE state_id = ${state_id};
    `;
  const stats = await database.get(getStateStats);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats[" SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
select state_id from district
where district_id = ${districtId};
`;
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);

  const getStateNameQuery = `
select state_name as stateName from state
where state_id = ${getDistrictIdQueryResponse.state_id};`;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
