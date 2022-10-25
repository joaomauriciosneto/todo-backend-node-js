const express = require('express')
const {Pool} = require('pg')
const cors = require('cors')
require('dotenv').config()

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL
})

const app = express()
app.use(express.json())
app.use(cors())
app.get('/', (req, res) => {console.log('Olá mundo!')})

const DOOR = process.env.PORT || 3333

app.post('/session', async (req, res) => {

    const {username} = req.body
    let user = ''
    
    try {
        user = await pool.query('SELECT * FROM users WHERE user_name = ($1)', [username])

        if(!user.rows[0]) {
            user = await pool.query('INSERT INTO users(user_name) VALUES ($1) RETURNING *', [username])
        }        

        return res.status(200).send(user.rows)

    } catch (error) {
        return res.status(400).send(error)
    }       
})

app.post('/todo/:user_id', async (req, res) => {

    const {description, done} = req.body
    const {user_id} = req.params

    try {

        const newTodo = await pool.
        query('INSERT INTO todos (todo_description, todo_done, user_id) VALUES ($1, $2, $3) RETURNING*',
        [description, done, user_id])

        return res.status(200).send(newTodo.rows)

    } catch (error) {
        return res.status(400).send(error)
    }
})

app.get('/todo/:user_id', async (req, res) => {

    const {user_id} = req.params

    try {

        const allTodos = await pool.
        query('SELECT * FROM todos WHERE user_id = ($1)', [user_id])

        return res.status(200).send(allTodos.rows)

    } catch (error) {
        return res.status(400).send(error)
    }
})

app.get('/all', async (req, res) => {

    try {

        const allUsers = await pool.
        query('SELECT * FROM users')

        return res.status(200).send(allUsers.rows)

    } catch (error) {
        return res.status(400).send(error)
    }
})

app.patch('/todo/:user_id/:todo_id', async (req, res) => {

    const {todo_id, user_id} = req.params
    const data = req.body

    try {
        const belongsToUser = await pool.
        query('SELECT * FROM todos WHERE user_id = ($1) AND todo_id = ($2)', [user_id, todo_id])

        if(!belongsToUser.rows[0]) {
            return res.status(400).send('not found')
        }

        const updateTodo = await pool.
        query('UPDATE todos SET todo_description = ($1), todo_done = ($2) WHERE todo_id = ($3) RETURNING *',
        [data.description, data.done, todo_id])

        return res.status(200).send(updateTodo.rows)

    } catch (error) {
        return res.status(400).send(error)
    }
})

app.delete('/session/:user_id', async (req, res) => {

    const {user_id} = req.params

    try {
        const belongsToUser = await pool.
        query('SELECT * FROM users WHERE user_id = ($1)', [user_id])

        if(!belongsToUser.rows[0]) {
            return res.status(404).send('User not found!')
        }

        const deletedUser = await pool.
        query('DELETE FROM users WHERE user_id = ($1) RETURNING *', [user_id])

        return res.status(200).send({
            message: 'User successfully deleted!',
            data: deletedUser.rows
        })
    } catch (error) {
        return res.status(400).send(error)
    }
})

app.delete('/todo/:user_id/:todo_id', async (req, res) => {

    const {user_id, todo_id} = req.params;

    try {

        const belongsToUser = await pool.
        query('SELECT * FROM todos WHERE user_id = ($1) AND todo_id = ($2)',
        [user_id, todo_id])

        if(!belongsToUser.rows[0]) {
            return res.status(400).send('todo not found!')
        }
        
        const deleted = await pool.
        query('DELETE FROM todos WHERE todo_id = ($1) RETURNING *', [todo_id])  
        
        return res.status(200).send({
            message: 'todo deleted',
            data: deleted.rows
        })
    } catch (error) {
        return res.status(400).send(error)
    }
})

app.listen(DOOR, () => console.log(`Server starter on port ${DOOR}`))