import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../utils/api';
import RecipeList from '../components/recipes/RecipeList';
import Sidebar from '../components/layout/Sidebar';
import '../styles/CategoryPage.css';

const CategoryPage = () => {
  const { name } = useParams();
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [categoryInfo, setCategoryInfo] = useState({
    name: decodeURIComponent(name),
    description: ''
  });

  useEffect(() => {
    // Reset when category changes
    setRecipes([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    setError(null);
    setCategoryInfo({
      name: decodeURIComponent(name),
      description: getCategoryDescription(decodeURIComponent(name))
    });
    
    // Fetch recipes for this category
    fetchCategoryRecipes();
  }, [name]);

  const fetchCategoryRecipes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/recipes', {
        params: { 
          category: decodeURIComponent(name),
          page, 
          limit: 12 
        }
      });
      
      if (response.data.success) {
        setRecipes(prevRecipes => 
          page === 1 ? response.data.data : [...prevRecipes, ...response.data.data]
        );
        
        setHasMore(response.data.data.length === 12 && response.data.meta?.has_more !== false);
      } else {
        setError('Nepavyko įkelti receptų šiai kategorijai.');
      }
    } catch (error) {
      console.error('Error fetching category recipes:', error);
      setError('Klaida įkeliant receptus. Bandykite vėliau.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreRecipes = () => {
    setPage(prevPage => prevPage + 1);
    fetchCategoryRecipes();
  };

  const getCategoryDescription = (categoryName) => {
    const descriptions = {
      'Gėrimai ir kokteiliai': 'Gardūs, gaivūs ir įdomūs gėrimai bei kokteiliai kiekvienai progai.',
      'Desertai': 'Saldūs gardumynai, pyragai ir deserai jūsų malonumui.',
      'Sriubos': 'Šiltos, gaivios ir maistingos sriubos visais metų laikais.',
      'Užkandžiai': 'Greiti ir skanūs užkandžiai vakarėliams ar kasdieniam malonumui.',
      'Varškė': 'Įvairūs receptai su varške - nuo desertų iki pagrindinio patiekalo.',
      'Kiaušiniai': 'Kūrybiški ir gardūs patiekalai, kurių pagrindas - kiaušiniai.',
      'Daržovės': 'Gardūs ir sveiki daržovių patiekalai visiems metų laikams.',
      'Bulvės': 'Tradiciniai ir modernūs receptai su bulvėmis - lietuviška klasika.',
      'Mėsa': 'Gardūs ir sodrūs mėsos patiekalai šventėms ir kasdienai.',
      'Žuvis ir jūros gėrybės': 'Šviežios žuvies ir jūros gėrybių receptai jūsų stalui.',
      'Kruopos ir grūdai': 'Maistingi ir skanūs patiekalai iš įvairių kruopų ir grūdų.',
      'Be glitimo': 'Skanūs receptai tiems, kas vengia glitimo.',
      'Be laktozės': 'Gardūs patiekalai be laktozės.',
      'Gamta lėkštėje': 'Receptai su laukiniais augalais ir gamtos dovanomis.',
      'Iš močiutės virtuvės': 'Tradiciniai lietuviški receptai, perduodami iš kartos į kartą.'
    };
    
    return descriptions[categoryName] || `Atraskite mūsų receptų kolekciją kategorijoje "${categoryName}".`;
  };

  return (
    <>
      <div className="content-main">
        <div className="category-header">
          <h1 className="category-title">{categoryInfo.name}</h1>
          <p className="category-description">{categoryInfo.description}</p>
        </div>
        
        <RecipeList
          recipes={recipes}
          loading={loading && page === 1}
          error={error}
        />
        
        {loading && page > 1 && (
          <div className="loading-more">
            <div className="loading-spinner"></div>
            <p>Kraunama daugiau receptų...</p>
          </div>
        )}
        
        {hasMore && !loading && (
          <div className="load-more-container">
            <button className="load-more-button" onClick={loadMoreRecipes}>
              DAUGIAU RECEPTŲ
            </button>
          </div>
        )}
      </div>
      
      <Sidebar />
    </>
  );
};

export default CategoryPage;