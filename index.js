const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Simularea datelor
let teams = ["Team A", "Team B", "Team C", "Team D"];
let selectedTeams = [];

// Endpoint pentru a prelua echipele și selecțiile
app.get("/teams", (req, res) => {
    res.json({ activeTeams: teams, selectedTeams });
});

// Endpoint pentru a selecta o echipă random
app.post("/random", (req, res) => {
    if (teams.length === 0) {
        // Dacă toate echipele au fost alese, reîncepe ciclul
        teams = [...selectedTeams];
        selectedTeams = [];
    }
    // Selectare aleatorie
    const randomIndex = Math.floor(Math.random() * teams.length);
    const selectedTeam = teams.splice(randomIndex, 1)[0];
    selectedTeams.push(selectedTeam);

    res.json({ selectedTeam, remainingTeams: teams });
});

// Pornirea serverului
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
