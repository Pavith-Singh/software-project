import Nav from './components/Nav/Nav'
import ThreeScene from './components/Nav/ThreeScene'

const Home: React.FC = () => {
  return (
    <div>
      <Nav />
      <div style={{ height: '60px' }} />
      <ThreeScene />
      <h1 className='relative z-10'>Homepage</h1>
    </div>
  )
}

export default Home