import React, { useState, useEffect } from 'react';
import Sentiment from 'sentiment';

const NewsFeed = ({ onSentimentChange }) => {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const API_KEY = 'YOUR_NEWS_API_KEY'; // Replace with your actual NewsAPI key
    const sentiment = new Sentiment();

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                const response = await fetch(`https://newsapi.org/v2/everything?q=stock+market&apiKey=${API_KEY}`);
                const data = await response.json();
                if (data.articles) {
                    const articlesWithSentiment = data.articles.map(article => {
                        const result = sentiment.analyze(article.title);
                        return { ...article, sentiment: result.score };
                    });
                    setNews(articlesWithSentiment);
                    onSentimentChange(articlesWithSentiment.map(a => a.sentiment));
                }
            } catch (error) {
                console.error("Error fetching news:", error);
            }
            setLoading(false);
        };

        fetchNews();
    }, []);

    return (
        <div>
            <h3>Market News</h3>
            {loading ? (
                <p>Loading news...</p>
            ) : (
                <ul>
                    {news.map((article, index) => (
                        <li key={index}>
                            <a href={article.url} target="_blank" rel="noopener noreferrer">
                                {article.title}
                            </a>
                            <span> (Sentiment: {article.sentiment})</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default NewsFeed;
