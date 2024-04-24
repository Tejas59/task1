import React from 'react';

const Home = () => {
    const name = localStorage.getItem('name');

    return (
        <div className='bg-white p-3 rounded w-25'>
            <h2>Welcome, {name}</h2>
        </div>
    );
};

export default Home;
