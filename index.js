const express = require("express");
const cors = require("cors");
const supabase = require("./supabaseClient");

const app = express();
app.use(cors());
app.use(express.json());

// Endpoint pentru a obține toate proiectele
app.get("/projects", async (req, res) => {
    try {
        const { data: projects, error } = await supabase.from("projects").select("*");
        if (error) return res.status(500).json({ message: error.message });

        res.json({ projects });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// Endpoint pentru a adăuga un proiect nou
app.post("/projects", async (req, res) => {
    const { name } = req.body;
    try {
        const { data, error } = await supabase.from("projects").insert([{ name }]);
        if (error) return res.status(400).json({ message: error.message });

        res.status(201).json({ message: "Project added successfully!", project: data });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
});

// Endpoint pentru a popula echipele în project_teams_temporary
app.post("/projects/:projectId/populate-teams", async (req, res) => {
    const { projectId } = req.params;

    try {
        // Verificăm dacă există echipe în `project_teams_temporary`
        const { data: temporaryTeams, error: fetchTemporaryError } = await supabase
            .from("project_teams_temporary")
            .select("team_name")
            .eq("project_id", projectId);

        if (fetchTemporaryError) throw fetchTemporaryError;

        // Dacă există echipe în tabelul temporar, le returnăm
        if (temporaryTeams.length > 0) {
            return res.status(200).json({ teams: temporaryTeams.map((team) => team.team_name) });
        }

        // Dacă tabelul temporar este gol, populăm din `project_teams_permanent`
        const { data: permanentTeams, error: fetchPermanentError } = await supabase
            .from("project_teams_permanent")
            .select("team_name")
            .eq("project_id", projectId);

        if (fetchPermanentError) throw fetchPermanentError;

        // Inserăm echipele permanente în tabelul temporar
        const { error: insertError } = await supabase
            .from("project_teams_temporary")
            .insert(permanentTeams.map((team) => ({ project_id: projectId, team_name: team.team_name })));

        if (insertError) throw insertError;

        // Returnăm echipele populate
        res.status(200).json({ teams: permanentTeams.map((team) => team.team_name) });
    } catch (error) {
        res.status(500).json({ message: "Failed to populate temporary teams", error: error.message });
    }
});

// Endpoint pentru a reseta echipele în project_teams_temporary
app.post("/projects/:projectId/reset-teams", async (req, res) => {
    const { projectId } = req.params;

    try {
        // Ștergem toate echipele din tabelul temporar pentru proiectul respectiv
        const { error: deleteError } = await supabase
            .from("project_teams_temporary")
            .delete()
            .eq("project_id", projectId);

        if (deleteError) throw deleteError;

        // Repopulăm tabelul temporar din tabelul permanent
        const { data: permanentTeams, error: fetchPermanentError } = await supabase
            .from("project_teams_permanent")
            .select("team_name")
            .eq("project_id", projectId);

        if (fetchPermanentError) throw fetchPermanentError;

        const { error: insertError } = await supabase
            .from("project_teams_temporary")
            .insert(permanentTeams.map((team) => ({ project_id: projectId, team_name: team.team_name })));

        if (insertError) throw insertError;

        res.status(200).json({ message: "Teams reset successfully!", teams: permanentTeams.map((team) => team.team_name) });
    } catch (error) {
        res.status(500).json({ message: "Failed to reset teams", error: error.message });
    }
});

// Endpoint pentru a actualiza echipele disponibile (după selecție)
app.post("/projects/:projectId/update-teams", async (req, res) => {
    const { projectId } = req.params;
    const { teams } = req.body;

    try {
        // Ștergem echipele existente în tabelul temporar pentru proiect
        const { error: deleteError } = await supabase
            .from("project_teams_temporary")
            .delete()
            .eq("project_id", projectId);

        if (deleteError) throw deleteError;

        // Inserăm lista actualizată de echipe
        const { error: insertError } = await supabase
            .from("project_teams_temporary")
            .insert(teams.map((team) => ({ project_id: projectId, team_name: team })));

        if (insertError) throw insertError;

        res.status(200).json({ message: "Teams updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to update teams", error: error.message });
    }
});

// Endpoint pentru a obține echipele din project_teams_temporary pentru un proiect
app.get("/projects/:projectId/teams", async (req, res) => {
    const { projectId } = req.params;

    try {
        const { data, error } = await supabase
            .from("project_teams_temporary")
            .select("team_name")
            .eq("project_id", projectId);

        if (error) throw error;

        res.status(200).json({ teams: data.map((row) => row.team_name) });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch teams", error: error.message });
    }
});

app.post("/projects/:projectId/history", async (req, res) => {
    const { projectId } = req.params;
    const { teamName } = req.body;

    try {
        const { error } = await supabase
            .from("history")
            .insert([{ project_id: projectId, team_name: teamName }]);

        if (error) throw error;

        res.status(201).json({ message: "History entry added successfully!" });
    } catch (error) {
        res.status(500).json({ message: "Failed to add history entry", error: error.message });
    }
});

app.get("/projects/:projectId/history", async (req, res) => {
    const { projectId } = req.params;

    try {
        const { data, error } = await supabase
            .from("history")
            .select("team_name, selected_at")
            .eq("project_id", projectId)
            .order("selected_at", { ascending: false })
            .limit(10);

        if (error) throw error;

        res.status(200).json({ history: data });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch history", error: error.message });
    }
});


app.post("/projects/:projectId/finalize", async (req, res) => {
    const { projectId } = req.params;
    const { lastPresenter, nextPresenter } = req.body;

    // Calculăm data următoarei prezentări (o săptămână de acum)
    const nextPresentationDate = new Date();
    nextPresentationDate.setDate(nextPresentationDate.getDate() + 7);

    try {
        const { error } = await supabase
            .from("projects")
            .update({
                last_presenter: lastPresenter,
                next_presenter: nextPresenter,
                next_presentation_date: nextPresentationDate.toISOString().split("T")[0],
            })
            .eq("id", projectId);

        if (error) throw error;

        res.status(200).json({
            message: "Project finalized successfully!",
            nextPresentationDate,
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to finalize project state",
            error: error.message,
        });
    }
});


app.get("/projects/:projectId/state", async (req, res) => {
    const { projectId } = req.params;

    try {
        const { data, error } = await supabase
            .from("projects")
            .select("last_presenter, next_presenter, next_presentation_date")
            .eq("id", projectId)
            .single();

        if (error) throw error;

        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({
            message: "Failed to fetch project state",
            error: error.message,
        });
    }
});

app.delete("/projects/:projectId/teams/:teamName", async (req, res) => {
    const { projectId, teamName } = req.params;

    try {
        const { error } = await supabase
            .from("project_teams_temporary")
            .delete()
            .eq("project_id", projectId)
            .eq("team_name", teamName);

        if (error) throw error;

        res.status(200).json({ message: `Team ${teamName} deleted successfully.` });
    } catch (error) {
        res.status(500).json({
            message: `Failed to delete team ${teamName}`,
            error: error.message,
        });
    }
});




const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
