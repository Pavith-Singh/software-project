/*    /index.html   200 */
import Nav from './components/Nav/Nav'
import SigninComponent from './components/Nav/SigninComponent'


function Signin() {
  return (
    <div className='bg-gradient-to-b from-red-600 via-red-900 to-black w-full h-screen flex items-center justify-center relative'>
      <Nav />
      <div style={{height: '60px' }} />
      <SigninComponent />
    </div>
  )
}

export default Signin
