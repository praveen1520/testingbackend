
const express=require("express")
const cors=require("cors")
const path=require("path")
const {open}=require("sqlite")
const sqlite3=require("sqlite3")
const dbpath=path.join(__dirname,"Todo.db")
const app=express()
const jsonMiddleware=express.json()
app.use(jsonMiddleware);
let db=null
app.use(cors())
const intializeandserve=async ()=>{
    try{
        db=await open({
            filename: dbpath,
            driver: sqlite3.Database,
        })
        app.listen(3001,()=>{
            console.log("server started at localhost//3000")
        })
       
    }catch(e){
        console.log(`db error:${e.message}`)
    }
}

// Get all books
app.get("/books", async (req, res) => {
    const booksQuery = `
            SELECT 
                Books.BookID,
                Books.Title,
                Books.Pages,
                Books.PublishedDate,
                author.Name AS AuthorName,
                Genres.Name AS GenreName
            FROM 
                Books
            INNER JOIN 
                author ON Books.AuthorID = author.AuthorID
            INNER JOIN 
                Genres ON Books.GenreID = Genres.GenreID;
        `;
        const books = await db.all(booksQuery);
        res.send(books);
});
app.post("/books", async (req, res) => {
    const { Title, AuthorName, GenreName, Pages, PublishedDate } = req.body;

    try {
        // Insert or retrieve the AuthorID
        let getAuthorQuery = `SELECT AuthorID FROM author WHERE Name = ?;`;
        let author = await db.get(getAuthorQuery, [AuthorName]);

        if (!author) {
            const insertAuthorQuery = `INSERT INTO author (Name) VALUES (?);`;
            const authorResult = await db.run(insertAuthorQuery, [AuthorName]);
            author = { AuthorID: authorResult.lastID }; // Retrieve the new AuthorID
        }

        // Insert or retrieve the GenreID
        let getGenreQuery = `SELECT GenreID FROM Genres WHERE Name = ?;`;
        let genre = await db.get(getGenreQuery, [GenreName]);

        if (!genre) {
            const insertGenreQuery = `INSERT INTO Genres (Name) VALUES (?);`;
            const genreResult = await db.run(insertGenreQuery, [GenreName]);
            genre = { GenreID: genreResult.lastID }; // Retrieve the new GenreID
        }

        // Insert the book with the retrieved or new AuthorID and GenreID
        const addBookQuery = `
            INSERT INTO Books (Title, AuthorID, GenreID, Pages, PublishedDate)
            VALUES (?, ?, ?, ?, ?);
        `;
        await db.run(addBookQuery, [Title, author.AuthorID, genre.GenreID, Pages, PublishedDate]);

        res.send({ message: "Book added successfully with author and genre handled." });
    } catch (error) {
        console.error("Error adding book:", error.message);
        res.status(500).send({ error: "Failed to add book." });
    }
});

// Update a book
app.put("/books/:id", async (req, res) => {
    const { id } = req.params;
    const { Title, AuthorName, GenreName, Pages, PublishedDate } = req.body;

    try {
        // Fetch or insert AuthorID
        let getAuthorQuery = `SELECT AuthorID FROM author WHERE Name = ?;`;
        let author = await db.get(getAuthorQuery, [AuthorName]);

        if (!author) {
            const insertAuthorQuery = `INSERT INTO author (Name) VALUES (?);`;
            const authorResult = await db.run(insertAuthorQuery, [AuthorName]);
            author = { AuthorID: authorResult.lastID };
        }

        // Fetch or insert GenreID
        let getGenreQuery = `SELECT GenreID FROM Genres WHERE Name = ?;`;
        let genre = await db.get(getGenreQuery, [GenreName]);

        if (!genre) {
            const insertGenreQuery = `INSERT INTO Genres (Name) VALUES (?);`;
            const genreResult = await db.run(insertGenreQuery, [GenreName]);
            genre = { GenreID: genreResult.lastID };
        }

        // Update the book with the retrieved IDs
        const updateBookQuery = `
            UPDATE Books
            SET Title = ?, AuthorID = ?, GenreID = ?, Pages = ?, PublishedDate = ?
            WHERE BookID = ?;
        `;
        await db.run(updateBookQuery, [
            Title,
            author.AuthorID,
            genre.GenreID,
            Pages,
            PublishedDate,
            id,
        ]);

        res.send({ message: "Book updated successfully" });
    } catch (error) {
        console.error("Error updating book:", error.message);
        res.status(500).send({ error: "Failed to update book." });
    }
});


// Delete a book
app.delete("/books/:id", async (req, res) => {
    const { id } = req.params;
    const deleteBookQuery = `DELETE FROM Books WHERE BookID = ?;`;
    await db.run(deleteBookQuery, [id]);
    res.send({ message: "Book deleted successfully" });
});

//get details by id

app.get("/books/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const bookQuery = `
            SELECT 
                Books.BookID,
                Books.Title,
                Books.Pages,
                Books.PublishedDate,
                author.Name AS AuthorName,
                Genres.Name AS GenreName
            FROM 
                Books
            INNER JOIN 
                author ON Books.AuthorID = author.AuthorID
            INNER JOIN 
                Genres ON Books.GenreID = Genres.GenreID
            WHERE 
                Books.BookID = ?;
        `;
        const book = await db.get(bookQuery, [id]);

        if (book) {
            res.json(book); // Ensure valid JSON is sent
        } else {
            res.status(404).json({ error: "Book not found" });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get('/books/:id', (req, res) => {
    console.log("Book ID received:", req.params.id);
    // Existing logic here
});
intializeandserve()