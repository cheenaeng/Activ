/* -------------------------------------------------------------------------- */
/*                                npm packages                                */
/* -------------------------------------------------------------------------- */
import express, { response } from 'express';
import cookieParser from 'cookie-parser';
import pg from 'pg';
import jsSHA from 'jssha';
import { render } from 'ejs';
import methodOverride from 'method-override';
import moment from 'moment';



const app = express();
app.listen(3005);
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(cookieParser());
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));


const SALT = process.env['MY_SALT']

/* -------------------------------------------------------------------------- */
/*                        DATABASE CONNECTION SETUP                           */
/* -------------------------------------------------------------------------- */
const { Pool } = pg;
const pgConnectionConfigs = {
  user: 'cheenaeng',
  host: 'localhost',
  database: 'activapp',
  port: 5432, // Postgres server always runs on this port
};
const pool = new Pool(pgConnectionConfigs);
/* -------------------------------------------------------------------------- */
/*                              HELPER FUNCTIONS                              */
/* -------------------------------------------------------------------------- */

/* ------------------------------ FOR USER AUTH ----------------------------- */
const getHash = (input) => {
const shaObj = new jsSHA('SHA-512', 'TEXT', { encoding: 'UTF8' });
  // create an unhashed cookie string based on user ID and salt
  const unhashedString = `${input}-${SALT}`;
  console.log(unhashedString)
  shaObj.update(unhashedString);

  return shaObj.getHash('HEX');
};

const checkAuth = (request,response,next)=>{
  request.isUserLoggedIn = false;
  if (request.cookies.loggedIn && request.cookies.userid){
    const hash = getHash(request.cookies.userid)

    if(request.cookies.loggedIn == hash){
      request.isUserLoggedIn = true;
    }
  }
    next();
}

/* -------------------------------------------------------------------------- */
/*                                   ROUTES                                   */
/* -------------------------------------------------------------------------- */

/* ----------------------- TO RENDER ADD WORKOUT FORM ----------------------- */

//to render workout form, need data from equipment to auto fill in checkboxes for equipment list, if others, to add in equipment 

app.get('/workout',checkAuth, (request,response)=>{
if (request.isUserLoggedIn === false) {
    response.status(403).send('sorry');
    return;
  }
  const equipmentListQuery = `Select * FROM equipment`
  const bodyPartsListQuery = `Select * FROM body_parts`

  const results = Promise.all([
    pool.query(equipmentListQuery),
    pool.query(bodyPartsListQuery)
  ])

  results.then(allResults => {
    const data = {
      equipment: allResults[0].rows,
      bodyParts: allResults[1].rows
    }
     response.render('add-workout-form',data)
  })
  .catch(error => console.log(error.stack))
 
})

app.post('/workout', (request,response)=>{
  const {workout_name, workout_description,sets,repetition,category_id,url_link,new_equipment, body_parts, location_id,equipment } = request.body
  const user_id = request.cookies.userid
  //update workout table 
  const inputValues = [workout_name,workout_description,parseInt(sets),parseInt(repetition),true,category_id,url_link,user_id]
  const updateWorkoutQuery = 'INSERT INTO workout(workout_name,workout_description,sets,repetition,is_custom,category_id,url_link,user_id) VALUES($1,$2,$3,$4,$5,$6,$7,$8) returning *'

  //update equipment table, only if new equipment is not null 
  const inputEquipmentData = [new_equipment]
  const updateEquipmentQuery = 'INSERT INTO equipment(equipment_required) VALUES ($1) returning *'
  //if new equipment is filled in then add to equipment table, else empty promise 
  const finalEquipmentQuery = !new_equipment? Promise.resolve():pool.query(updateEquipmentQuery,inputEquipmentData);

  const allResults = Promise.all([pool.query(updateWorkoutQuery,inputValues), finalEquipmentQuery])

  allResults
  .then(results => {
    const workoutResults = results[0].rows 
    const allEquipmentUsed = [...equipment,...new_equipment]

    //update workout_equipment table, run a for each loop on all the equipment 
    workoutResults.forEach(workout=>{

      const equipmentQuery = allEquipmentUsed.map(equipmentId =>{
        const inputData = [workout.id,equipmentId]
        const insertIntoWorkoutEquipment = `INSERT INTO workout_equipment(workout_id,equipment_id)VALUES($1,$2) returning *`
        return pool.query(insertIntoWorkoutEquipment,inputData)
      })

       const bodyPartsQuery = [...body_parts].map(bodyPart =>{
        const inputValue = [workout.id,parseInt(bodyPart)]
        const insertIntoWorkoutBodyPart = 'INSERT INTO workout_body_parts(workout_id,body_parts_id) VALUES($1,$2) returning *'
        return pool.query(insertIntoWorkoutBodyPart,inputValue)
      })

      const locationQuery = [...location_id].map(location =>{
        const inputLocation = [workout.id,parseInt(location)]
        const insertIntoWorkoutLocation = 'INSERT INTO workout_locations(workout_id,location_id) VALUES($1,$2) returning *'
        return pool.query(insertIntoWorkoutLocation,inputLocation)
      })

      const update3TablesQuery = Promise.all([equipmentQuery,bodyPartsQuery,locationQuery])
      .then(result => {
        console.log(result.rows)
        response.render('post-form')
      })
      .catch(error => {
        console.log(error.stack)
      })   
  })
})
})

//to render form to edit individual workout 
app.get('/workout/:index/edit', (request,response)=>{
  const {index} = request.params
  const equipmentListQuery = `Select * FROM equipment`
  const bodyPartsListQuery = `Select * FROM body_parts`
  const workoutQuery = `SELECT * FROM workout WHERE id = ${index}`

  const results = Promise.all([
    pool.query(equipmentListQuery),
    pool.query(bodyPartsListQuery),
    pool.query(workoutQuery)
  ])

  results.then(allResults => {
    const data = {
      equipment: allResults[0].rows,
      bodyParts: allResults[1].rows,
      workout:allResults[2].rows
    }
    console.log(data)
   response.render('workout-edit-form', data)
  })
})

//get edit form (get request, with details of the workout form already filled in --> select all from workout where id = specific id)

app.put('/workout/:index', (request,response)=>{

  console.log('edit request ')
    const {index} = request.params
    const {workout_name, workout_description,sets,repetition,category_id,url_link, new_equipment, gym_equipment, body_parts, location_id,equipment } = request.body

    //update workout table 
    const editedInputValues = [workout_name,workout_description,parseInt(sets),parseInt(repetition),true,category_id,url_link]
    const editWorkoutQuery = `UPDATE workout SET workout_name=$1, workout_description=$2, sets=$3, repetition=$4, is_custom=$5, category_id=$6,url_link=$7 WHERE workout.id = ${index}`

    //update equipment table, only if new equipment is not null 
    const editEquipmentData = [new_equipment,gym_equipment??false]
    const editEquipmentQuery = 'UPDATE equipment SET equipment_required =$1, gym_equipment=$2'
    //if new equipment is filled in then add to equipment table, else emptry promise 
    const finalEquipmentQuery = !new_equipment? Promise.resolve():pool.query(editEquipmentQuery,editEquipmentData);

    const allResults = Promise.all([pool.query(editWorkoutQuery,editedInputValues), finalEquipmentQuery])
    
    //to delete the old rows 
    const workoutEquipQuery =`DELETE FROM workout_equipment WHERE workout_id = ${index}`
    const workoutBodyPartsQuery = `DELETE FROM workout_body_parts WHERE workout_id = ${index}`
    const workoutLocationsQuery = `DELETE FROM workout_locations WHERE workout_id = ${index}`

    const deleteQueries = Promise.all([pool.query(workoutEquipQuery), pool.query(workoutBodyPartsQuery), pool.query(workoutLocationsQuery)])

    deleteQueries
    .then(result =>{
    console.log(`${result}, deleted rows`)
    })
    .catch (error => console.log(error.stack))

    //to update new rows 
    allResults
    .then(results => {
  
    const allEquipmentUsed = [...equipment,...new_equipment]
    
    const equipmentQuery = allEquipmentUsed.map(equipmentId =>{
      const inputData = [index,equipmentId]
      const insertIntoWorkoutEquipment = `INSERT INTO workout_equipment(workout_id,equipment_id)VALUES($1,$2) returning *`
      return pool.query(insertIntoWorkoutEquipment,inputData)
    })
      
    const bodyPartsQuery = [...body_parts].map(bodyPart =>{
      const inputValue = [index,parseInt(bodyPart)]
      const insertIntoWorkoutBodyPart = 'INSERT INTO workout_body_parts(workout_id,body_parts_id) VALUES($1,$2) returning *'
      return pool.query(insertIntoWorkoutBodyPart,inputValue)
    })

    const locationQuery = [...location_id].map(location =>{
      const inputLocation = [index,parseInt(location)]
      const insertIntoWorkoutLocation = 'INSERT INTO workout_locations(workout_id,location_id) VALUES($1,$2) returning *'
      return pool.query(insertIntoWorkoutLocation,inputLocation)
    })

      const update3TablesQuery = Promise.all([equipmentQuery,bodyPartsQuery,locationQuery])
      .then(result => {
  
        response.render('post-form')

      })
      .catch(error => console.log(error.stack))   
    })
  })


app.delete('/workout/:index', (request,response) =>{
const {index} = request.params
const workoutQuery =`DELETE FROM workout WHERE id = ${index}`

pool.query(workoutQuery)
.then(result => 
  response.redirect('/'))
.catch(error => console.log(error.stack))
  
})


/* ----------------------- 1. TO SHOW INDIVIDUAL EXERCISE ----------------------- */

app.get('/workout/:index',checkAuth, (request,response)=>{
  const {index} = request.params
  const userID = request.cookies.userid
  const workoutQuery = `Select * from workout,equipment,workout_equipment WHERE workout.id = workout_equipment.workout_id AND workout_equipment.equipment_id= equipment.id  AND workout.id = ${index}`
  const templateQuery = `Select * from template WHERE user_id = ${userID}`

  
  const allresults = Promise.all
  ([
    pool.query(workoutQuery),
    pool.query(templateQuery)
  ])

  allresults
  .then(result=>{
    const workoutsData = {
      workouts: result[0].rows,
      templates:result[1].rows
    }
    console.log(workoutsData)
    response.render('workout-data',workoutsData)
  })
  .catch(error => console.log(error.stack))
})

app.get('/template', (request,response)=>{
  const userID = request.cookies.userid
  const getAllTemplateQuery = `Select * from template WHERE user_id =${userID}`

  pool.query(getAllTemplateQuery)
  .then(result=>{


    const data = {
      templates: result.rows
    }
  response.render('template', data)
  })
  .catch(error=>console.log(error.stack))
})


app.post('/workout/:index', (request,response)=>{
  const {index} = request.params
  const {template_id} = request.body
  const inputValue = [index,template_id]

  const insertIntoTemplateQuery = `INSERT INTO workout_template(workout_id,template_id) VALUES($1,$2) RETURNING * `
  pool
  .query(insertIntoTemplateQuery,inputValue)
  .then (result => {
    console.log(result.rows)
    response.redirect(`/workout/${index}`)
  })
  .catch (error => console.log(error.stack))

})

/* ---------------- 2. MAIN PAGE- QUERY BY LOCATION AND CATEGORY --------------- */
app.get('/',checkAuth, (request,response)=>{
  if (request.isUserLoggedIn === false) {
    response.status(403).send('sorry, you have no permission. Please login');
    return;
  }
 
  else {
    const userID = request.cookies.userid
    const templateQuery = `SELECT * FROM template WHERE user_id = ${userID}`
    const userQuery = `SELECT * FROM users WHERE id = ${userID}`
    const allResults = Promise.all([ pool.query(templateQuery),pool.query(userQuery)])

    allResults
    .then(result =>{
      const data = {
        userName: result[1].rows[0].username,
        templates: result[0].rows
      }
      console.log(data)
      response.render('main',data ) 
      } 
     )
    .catch(error=>console.log(error.stack))
  }
})

app.post('/', (request,response)=>{
  const {location,category} = request.body 
  console.log(request.body)

  response.redirect(`/search?location='${location}'&category=${category}`)
})


/* ---------------- 3. AFTER SEARCHING BY CATEGORY AND LOCATION ---------------- */

app.get('/search', (request,response)=>{
  console.log("request sent")
  const locationQuery = request.query.location 
  const categoryQuery = request.query.category 
  console.log(locationQuery)
  console.log(categoryQuery)

const workoutLocationQuery = `SELECT workout.id, workout_name, location_text, locations.id as location_id, workout.category_id
  FROM workout 
  INNER JOIN workout_locations
  ON workout.id = workout_locations.workout_id 
  INNER JOIN locations
  ON locations.id= workout_locations.location_id
  WHERE location_text = ${locationQuery} 
  AND workout.category_id = ${categoryQuery}`

if (categoryQuery ==='1'){
  console.log("strength workout")
  pool
  .query(`Select * from body_parts`)
  .then(result =>{
  const bodyPartsData = {
    bodyParts : result.rows
  }

  response.render('strength-workout',bodyPartsData)
  })
  }
else {
  pool
  .query(workoutLocationQuery)
  .then (result =>{
  //if strength category, then go by body parts, else rest render same 
    const requiredData = {
    location: locationQuery,
    category:categoryQuery,
    workouts: result.rows
    }
    console.log(requiredData)
    response.render('search-results', requiredData)
  })
  .catch (error => console.log(error.stack))
  }
})

/* ------ 4. SEARCH BY BODY PART - ONLY APPLICABLE FOR STRENGTH EXERCISES ------ */

app.get('/strength/:bodyPart',(request,response)=>{
  const {bodyPart} = request.params
  console.log(bodyPart)
  const bodyPartsQuery = `Select workout_id,body_parts_id,body_parts_name,workout_name,category_id
    FROM workout_body_parts, body_parts,workout
    WHERE workout.id = workout_body_parts.workout_id
    AND body_parts.id = workout_body_parts.body_parts_id 
    AND category_id = 1
    AND body_parts_name = '${bodyPart}' `
    
  pool
  .query(bodyPartsQuery)
  .then (result =>{
    const data = {
     specificBodyPart:bodyPart,
     workouts: result.rows
    }

    response.render('specific-bodyparts-exercise', data)
  })
  .catch(error => console.log(error.stack))

})

/* --------------- 5. TEMPLATE AND ADDING & REMOVING WORKOUTS TO TEMPLATE -------------- */


app.get('/template/:templateID',(request,response)=>{
  const {templateID} = request.params
  const showWorkoutsTemplateQuery = `SELECT * FROM workout_template,workout,template WHERE workout_template.workout_id = workout.id AND workout_template.template_id= ${templateID}`
  

  const showRelevantEquipment = `SELECT * FROM workout_template,workout, workout_equipment, equipment
  WHERE workout.id = workout_template.workout_id AND workout.id= workout_equipment.workout_id AND equipment.id = workout_equipment.equipment_id
  AND workout_template.template_id = ${templateID} 
`

const queryResults = Promise.all([pool.query(showWorkoutsTemplateQuery), pool.query(showRelevantEquipment)])

queryResults
  .then(result=>{
    console.log(result.rows)
    const data = {
      workouts: result[0].rows,
      template: templateID,
      relevantEquipment:result[1].rows
    }
     console.log(data)
    response.render("template-workout",data)
  })
  .catch(error => console.log(error.stack))
})

app.delete('/:templateID/:workoutID', (request,response)=>{
  const {templateID, workoutID} =  request.params

  const deleteWorkoutFromTemplate = `DELETE FROM workout_template where workout_id = ${workoutID}`

  pool.query(deleteWorkoutFromTemplate)
  .then(()=> 
  response.redirect(`/template/${templateID}`))
  .catch(error=> console.log(error.stack))
})



/* ---------------------- 6.To add and rmeove template ---------------------- */

app.post('/template',(request,response) =>{
  const {template_name} = request.body
  const userID = request.cookies.userid
  const todayDate = moment().format("dddd,MMMM Do YYYY")
  console.log(todayDate)
  const inputTemplate = [template_name,userID,todayDate]
  const insertNewTemplateQuery = 'INSERT INTO template (template_name,user_id,created_date) VALUES($1,$2,$3)'

  pool
  .query(insertNewTemplateQuery,inputTemplate)
  .then (result => {
    response.redirect('back')
  })
  .catch(error=>console.log(error.stack))
})

app.delete('/:templateID', (request,response)=>{
  const {templateID} = request.params
  const deleteTemplateQuery = `DELETE FROM template WHERE id = ${templateID}`

  pool.query(deleteTemplateQuery)
  .then(result => 
   { 
    console.log(result.rows)
    response.redirect('/template')
   })
   .catch(error=>console.log(error.stack))
})

/* ------------------------------ 7.user login ------------------------------ */

app.get('/login',(__,response) => {
  const incorrectMessage = ''
  
  response.render('login', {user: {error: false, errorMsg:incorrectMessage}})
})

app.get('/signup', (__,response)=>{
  const conflicMsg =''
  response.render('signup',{user: {error: false, errorMsg:conflicMsg}})
})

app.post('/signup', (request,response) =>{
  const {username,password, email} = request.body 
  console.log(typeof password)
  const passwordHashed = getHash(password)
  let conflictMsg = 'User exists. Please try again'
  
  const inputValues = [username,passwordHashed,email]
  const inputUserQuery = 'INSERT INTO users (username,hashed_password,email) VALUES($1,$2,$3) ON CONFLICT(username,email) DO NOTHING RETURNING *'

  pool.query(inputUserQuery,inputValues)
  .then((result)=> {
    console.log(result.rows)
    if (result.rows.length ===0){
      console.log('no result')
      response.status(403).render('signup',{user: {error: true, errorMsg:conflictMsg}})
      return
    }
    else (response.redirect('/login'))
  })
  .catch(error=>error.stack)

})

app.post('/login',(request,response)=>{
  
  const {username, password} = request.body 
  const hashedPassword = getHash(password)
  
  const selectUsersQuery = `SELECT * FROM users WHERE username = '${username}'`
  const incorrectMessage = 'The username or password you have entered is incorrect'
  

  pool.query(selectUsersQuery)
 .then((result)=>{
  if (result.rows.length===0){
    //username not found
    response.status(403).render('login',{user: {error: true, errorMsg:incorrectMessage}})
    return 
  }
  console.log(result.rows[0].hashed_password,"system password")
  console.log(hashedPassword, "keyed in")
  if (result.rows[0].hashed_password === hashedPassword){
    const hashedCookieString = getHash(result.rows[0].id);

    response.cookie('loggedIn',hashedCookieString)
    response.cookie('userid', result.rows[0].id)
    response.redirect('/')
  }
  else {
    response.status(403).render('login',{user: {error: true, errorMsg:incorrectMessage}})
  }
  })
.catch(error=>{
  console.log("error,running,request",error.stack)
  response.status(503).render('login',{user: {error: true, errorMsg:incorrectMessage}})
  })
})


app.delete('/user/workout/logout', (request,response)=>{
 
    response.clearCookie('userid')
    response.clearCookie('loggedIn')

    response.redirect('/login')
  }
)


app.get('/all-workouts',(request,response)=>{
  const userID = request.cookies.userid
  const allWorkoutList = `SELECT * FROM workout WHERE user_id is null OR user_id = ${userID}`
  const userGeneratedList = `SELECT * FROM workout WHERE user_id = ${userID}`
  const workoutsFiilterByLocations = `SELECT workout_name,location_text,workout.id FROM workout, workout_locations, locations WHERE workout_locations.workout_id = workout.id AND workout_locations.location_id = locations.id`
  const workoutsFilterByCategory = `SELECT workout_name, category_type, workout.id FROM workout,category WHERE workout.category_id = category.id`



  const workoutListsResults = Promise.all([pool.query(allWorkoutList), pool.query(userGeneratedList), pool.query(workoutsFiilterByLocations), pool.query(workoutsFilterByCategory)])


  workoutListsResults.then(result=>
  {
    const allWorkoutData = {
      workouts: result[0].rows,
      userWorkouts:result[1].rows,
      workoutLocations:result[2].rows,
      workoutCategory: result[3].rows
    }
    console.log(allWorkoutData)
    response.render('allworkouts',allWorkoutData)
  })
  .catch(error => error.stack)
})


app.post('/allworkouts/find-workout', (request,response)=>{
  const {searchbar} = request.body
 
  const splittedKeywords = searchbar
  .trim()
  .toLowerCase()
  .split(' ')

  splittedKeywords.forEach( word => {
    const searchWorkoutQuery = `SELECT * FROM workout WHERE workout_name LIKE '%${word}%'`

    pool.query(searchWorkoutQuery)
    .then (result => {
      console.log(result.rows)
      const workoutData = {
        workouts:result.rows
      }
      console.log(workoutData)
      response.render('find-results', workoutData)
    })
    .catch(error=> error.stack)
  })
})

app.post('/workout/favorite/:index', (request,response)=>{

  const {index} = request.params

  const favoriteQuery = `UPDATE workout SET likes = true WHERE workout.id = ${index}`

  pool.query(favoriteQuery)
  .then(result =>
   console.log(result.rows)
  )
  .catch(error=> console.log(error.stack))
 })

 app.get('/favorite',(request,response)=>{
   const getWorkoutList = 'SELECT * FROM workout WHERE likes=true'

   pool.query(getWorkoutList)
   .then(result=>{
     const data = {
       favoritesList : result.rows 
     }

     response.render('favorites', data)
   })
   .catch(error=>console.log(error.stack))
 })

 app.delete('/workout/favorite/:index', (request,response)=>{
   const {index}=request.params

   const deleteFromFavoriteQuery =`UPDATE workout SET likes = false WHERE workout.id = ${index}`

   pool.query(deleteFromFavoriteQuery)
   .then(()=>response.redirect('back'))
   .catch(error=>console.log(error.stack))
 })


