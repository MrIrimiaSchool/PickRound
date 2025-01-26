const supabase = require('./supabaseClient');

async function setupTables() {
    const queries = [
        // Tabelul projects
        `CREATE TABLE IF NOT EXISTS projects (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL
        );`,

        // Tabelul project_teams_permanent
        `CREATE TABLE IF NOT EXISTS project_teams_permanent (
            id SERIAL PRIMARY KEY,
            project_id INT REFERENCES projects(id) ON DELETE CASCADE,
            team_name TEXT NOT NULL,
            UNIQUE (project_id, team_name)
        );`,

        // Tabelul project_teams_temporary
        `CREATE TABLE IF NOT EXISTS project_teams_temporary (
            id SERIAL PRIMARY KEY,
            project_id INT REFERENCES projects(id) ON DELETE CASCADE,
            team_name TEXT NOT NULL,
            UNIQUE (project_id, team_name)
        );`,

        `CREATE TABLE IF NOT EXISTS history (
            id SERIAL PRIMARY KEY,
            project_id INT REFERENCES projects(id) ON DELETE CASCADE,
            team_name TEXT NOT NULL,
            selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );`
    ];

    for (const query of queries) {
        const { error } = await supabase.rpc('execute_sql', { sql: query });
        if (error) {
            console.error('Error executing query:', error.message);
        } else {
            console.log('Query executed successfully:', query);
        }
    }
}

setupTables();

