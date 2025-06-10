import Nav from './components/Nav/Nav'
import Contact_form from './components/Nav/Contact_Form'

function Support() {
  return (
    <div className='bg-gradient-to-b from-red-600 via-red-900 to-black min-h-screen w-full flex flex-col'>
      <Nav />
      <div className='flex flex-1 items-center justify-center'>
        <Contact_form />
      </div>
    </div>
  )
}

export default Support
