import Nav from './components/Nav/Nav'

const Home: React.FC = () => {
  return (
    <div>
      <Nav />
      <div style={{ height: '60px' }} />
      <h1>Homepage</h1>
      <div style={{ height: '2000px', background: 'linear-gradient(white, #eee 80%, #ccc)' }}>
        <p style={{ padding: '20px', fontSize: '1.2rem' }}>
          Scroll down to test the sticky navbar. This content is just here to make the page scrollable.
        </p>
      </div>
    </div>
  )
}

export default Home