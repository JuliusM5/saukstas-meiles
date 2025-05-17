
exports.getNewsletterTemplate = (recipe, recipientEmail) => {
  const recipeUrl = `http://localhost:3000/recipe/${recipe.id}`;
  const unsubscribeUrl = `http://localhost:3000/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Naujas receptas: ${recipe.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          padding: 20px 0;
          border-bottom: 2px solid #eee8e0;
        }
        .logo {
          font-family: 'Playfair Display', serif;
          font-size: 24px;
          color: #7f4937;
        }
        .recipe-title {
          font-size: 24px;
          color: #7f4937;
          margin: 20px 0;
          text-align: center;
        }
        .recipe-image {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 5px;
          margin: 20px 0;
        }
        .recipe-intro {
          font-style: italic;
          color: #7f4937;
          margin-bottom: 20px;
          padding-left: 15px;
          border-left: 3px solid #7f4937;
        }
        .cta-button {
          display: inline-block;
          background-color: #7f4937;
          color: white;
          text-decoration: none;
          padding: 10px 20px;
          border-radius: 4px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee8e0;
          text-align: center;
          font-size: 12px;
          color: #7a7a7a;
        }
        .unsubscribe {
          color: #7f4937;
          text-decoration: underline;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">Šaukštas Meilės</div>
        </div>
        
        <h1 class="recipe-title">${recipe.title}</h1>
        
        ${recipe.image ? 
          `<img src="http://localhost:3000/img/recipes/${recipe.image}" alt="${recipe.title}" class="recipe-image">` : 
          ''}
        
        ${recipe.intro ? 
          `<div class="recipe-intro">${recipe.intro}</div>` : 
          ''}
        
        <div style="text-align: center;">
          <a href="${recipeUrl}" class="cta-button">Skaityti visą receptą</a>
        </div>
        
        <div class="footer">
          <p>Šaukštas Meilės - naminiai lietuviški receptai su meile</p>
          <p>
            <a href="${unsubscribeUrl}" class="unsubscribe">Atsisakyti naujienlaiškio prenumeratos</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};