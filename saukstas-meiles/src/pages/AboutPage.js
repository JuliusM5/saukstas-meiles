// src/pages/AboutPage.js
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../utils/api';
import Sidebar from '../components/layout/Sidebar';
import '../styles/AboutPage.css';

const AboutPage = () => {
  const [aboutData, setAboutData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState('');
  
  const contactRef = useRef(null);

  useEffect(() => {
    fetchAboutData();
    
    // Check if URL has #contact anchor
    if (window.location.hash === '#contact' && contactRef.current) {
      setTimeout(() => {
        contactRef.current.scrollIntoView({ behavior: 'smooth' });
      }, 500);
    }
  }, []);

  const fetchAboutData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/about');
      
      if (response.data.success) {
        setAboutData(response.data.data);
      } else {
        setError('Nepavyko įkelti informacijos.');
      }
    } catch (error) {
      console.error('Error fetching about data:', error);
      setError('Klaida įkeliant informaciją. Bandykite vėliau.');
      
      // Use default data if API fails completely
      setAboutData(getDefaultAboutData());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultAboutData = () => {
    return {
      title: 'Apie Mane',
      subtitle: 'Kelionė į širdį per maistą, pilną gamtos dovanų, švelnumo ir paprastumo',
      intro: 'Sveiki, esu Lidija – keliaujanti miško takeliais, pievomis ir laukais, kur kiekvienas žolės stiebelis, vėjo dvelksmas ar laukinė uoga tampa įkvėpimu naujam skoniui. Maisto gaminimas ir fotografija man – tai savotiška meditacija, leidžianti trumpam sustoti ir pasimėgauti akimirka šiandieniniame chaose.',
      sections: [
        {
          title: 'Mano istorija',
          content: 'Viskas prasidėjo mažoje kaimo virtuvėje, kur mano močiutė Ona ruošdavo kvapnius patiekalus iš paprastų ingredientų. Stebėdavau, kaip jos rankos minkydavo tešlą, kaip ji lengvai ir gracingai sukosi tarp puodų ir keptuvių, kaip pasakodavo apie kiekvieną žolelę, kurią pridėdavo į sriubą ar arbatą.\n\nBaigusi mokyklą, persikėliau į Kauną studijuoti ir pradėjau kurti savo virtuvėje. Dirbau įvairiose maisto srityse – nuo restoranų iki maisto stilistikos žurnalams. Tačiau po ilgo laiko, praleisto mieste, pajutau poreikį grįžti prie savo šaknų, arčiau gamtos, arčiau tų paprastų, bet sodrių skonių, kurie lydėjo mano vaikystę.'
        },
        {
          title: 'Mano filosofija',
          content: 'Tikiu, kad maistas yra daugiau nei tik kuras mūsų kūnui – tai būdas sujungti žmones, išsaugoti tradicijas ir kurti naujus prisiminimus. Mano kulinarinė filosofija grindžiama trimis pagrindiniais principais:\n\nPaprastumas. Geriausios receptų idėjos dažnai gimsta iš paprastumo. Naudoju nedaug ingredientų, bet kiekvienas jų atlieka svarbų vaidmenį patiekalo skonio ir tekstūros harmonijoje.\n\nSezoniniai produktai. Gamta yra geriausia šefė, todėl gerbiu jos ritmą ir renkuosi produktus, kurie yra savo geriausios kokybės tuo metu. Pavasario žalumynai, vasaros uogos, rudens grybai ir žiemos šakniavaisiai – kiekvienas sezonas turi savo išskirtinį charakterį.'
        }
      ],
      social: {
        email: 'lidija@saukstas-meiles.lt',
        facebook: 'https://facebook.com/saukstas.meiles',
        instagram: 'https://instagram.com/saukstas.meiles',
        pinterest: 'https://pinterest.com/saukstas.meiles'
      }
    };
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError('');
    
    // Validate form
    if (!contactForm.name || !contactForm.email || !contactForm.message) {
      setFormError('Prašome užpildyti visus būtinus laukus.');
      setFormSubmitting(false);
      return;
    }
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(contactForm.email)) {
      setFormError('Prašome įvesti teisingą el. pašto adresą.');
      setFormSubmitting(false);
      return;
    }
    
    try {
      // For now, just simulate a successful API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFormSuccess(true);
      setContactForm({
        name: '',
        email: '',
        message: ''
      });
      
      // Reset success message after 5 seconds
      setTimeout(() => {
        setFormSuccess(false);
      }, 5000);
    } catch (error) {
      console.error('Error sending contact form:', error);
      setFormError('Klaida siunčiant žinutę. Bandykite vėliau.');
    } finally {
      setFormSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <div className="content-main">
          <div className="about-page-loading">
            <div className="loading-spinner"></div>
            <p>Kraunama informacija...</p>
          </div>
        </div>
        <Sidebar />
      </>
    );
  }

  // Use API data or default data
  const data = aboutData || getDefaultAboutData();

  return (
    <>
      <div className="content-main">
        <div className="about-page-main">
          <div className="about-header">
            <h1 className="about-title">{data.title}</h1>
            <p className="about-subtitle">{data.subtitle}</p>
          </div>
          
          <div className="about-image">
            {data.image ? (
              <img 
                src={data.image} 
                alt="Autorė" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='300' viewBox='0 0 500 300'%3E%3Crect fill='%23f8f5f1' width='500' height='300'/%3E%3Ctext fill='%237f4937' font-family='sans-serif' font-size='30' text-anchor='middle' x='250' y='150'%3ELidija - Šaukštas Meilės autorė%3C/text%3E%3C/svg%3E";
                }}
              />
            ) : (
              <div className="placeholder-image">
                <span>Lidija - Šaukštas Meilės autorė</span>
              </div>
            )}
          </div>
          
          <p className="about-intro">{data.intro}</p>
          
          <div className="about-content">
            {data.sections && data.sections.map((section, index) => (
              <div key={index} className="about-section">
                <h2 className="about-section-title">{section.title}</h2>
                {section.content.split('\n\n').map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
                
                {index === 0 && (
                  <div className="about-factbox">
                    <h3>Trys įdomūs faktai apie mane</h3>
                    <ul>
                      <li>Kiekvieną pavasarį praleidžiu bent savaitę miške, rinkdama laukines žoleles ir grybus, kuriuos vėliau naudoju savo receptuose.</li>
                      <li>Turiu kolekciją senų lietuviškų receptų knygų, kurių seniausiai yra virš 100 metų.</li>
                      <li>Kartą kepiau tortą Lietuvos prezidentūrai – tai buvo vienas didžiausių iššūkių mano kulinarinėje kelionėje!</li>
                    </ul>
                  </div>
                )}
              </div>
            ))}
            
            <div className="about-section" ref={contactRef}>
              <h2 className="about-section-title" id="contact">Susisiekite su manimi</h2>
              <p>Jei turite klausimų, pasiūlymų ar tiesiog norite pasidalinti savo kulinarinėmis istorijomis, būtinai susisiekite!</p>
              
              <div className="social-links-large">
                <a href={`mailto:${data.social?.email || 'info@saukstas-meiles.lt'}`} className="social-link-large">
                  <i className="fa fa-envelope"></i>
                </a>
                <a href={data.social?.instagram || '#'} className="social-link-large" target="_blank" rel="noopener noreferrer">
                  <i className="fa fa-instagram"></i>
                </a>
                <a href={data.social?.facebook || '#'} className="social-link-large" target="_blank" rel="noopener noreferrer">
                  <i className="fa fa-facebook"></i>
                </a>
                <a href={data.social?.pinterest || '#'} className="social-link-large" target="_blank" rel="noopener noreferrer">
                  <i className="fa fa-pinterest"></i>
                </a>
              </div>
              
              <div className="contact-form">
                {formSuccess && (
                  <div className="form-success">
                    Ačiū už jūsų žinutę! Susisieksiu su jumis artimiausiu metu.
                  </div>
                )}
                
                {formError && (
                  <div className="form-error">
                    {formError}
                  </div>
                )}
                
                <form onSubmit={handleContactSubmit}>
                  <div className="form-group">
                    <label htmlFor="name">Vardas</label>
                    <input 
                      type="text" 
                      id="name" 
                      name="name" 
                      value={contactForm.name}
                      onChange={handleInputChange}
                      className="form-control" 
                      required 
                      disabled={formSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email">El. paštas</label>
                    <input 
                      type="email" 
                      id="email" 
                      name="email" 
                      value={contactForm.email}
                      onChange={handleInputChange}
                      className="form-control" 
                      required 
                      disabled={formSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="message">Žinutė</label>
                    <textarea 
                      id="message" 
                      name="message" 
                      value={contactForm.message}
                      onChange={handleInputChange}
                      className="form-control" 
                      rows="5" 
                      required
                      disabled={formSubmitting}
                    ></textarea>
                  </div>
                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={formSubmitting}
                  >
                    {formSubmitting ? 'Siunčiama...' : 'Siųsti žinutę'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Sidebar />
    </>
  );
};

export default AboutPage;