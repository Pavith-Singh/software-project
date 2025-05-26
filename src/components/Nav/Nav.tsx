import React, { useState } from 'react'
const suggestions = [
    //field done with chatgpt
  "English Advanced – Year 11",
  "English Standard – Year 11",
  "English Studies – Year 11",
  "English Extension 1 – Year 11",
  "English EAL/D – Year 11",
  "English Life Skills – Year 11",
  "English Advanced – Year 12",
  "English Standard – Year 12",
  "English Studies – Year 12",
  "English Extension 1 – Year 12",
  "English Extension 2 – Year 12",
  "English EAL/D – Year 12",
  "English Life Skills – Year 12",
  "Mathematics Advanced – Year 11",
  "Mathematics Standard – Year 11",
  "Mathematics Extension 1 – Year 11",
  "Mathematics Life Skills – Year 11",
  "Mathematics Advanced – Year 12",
  "Mathematics Standard 1 – Year 12",
  "Mathematics Standard 2 – Year 12",
  "Mathematics Extension 1 – Year 12",
  "Mathematics Extension 2 – Year 12",
  "Mathematics Life Skills – Year 12",
  "Biology – Year 11",
  "Chemistry – Year 11",
  "Physics – Year 11",
  "Earth and Environmental Science – Year 11",
  "Investigating Science – Year 11",
  "Science Life Skills – Year 11",
  "Biology – Year 12",
  "Chemistry – Year 12",
  "Physics – Year 12",
  "Earth and Environmental Science – Year 12",
  "Investigating Science – Year 12",
  "Science Life Skills – Year 12",
  "Ancient History – Year 11",
  "Modern History – Year 11",
  "Geography – Year 11",
  "Legal Studies – Year 11",
  "Society and Culture – Year 11",
  "Studies of Religion I – Year 11",
  "Studies of Religion II – Year 11",
  "Aboriginal Studies – Year 11",
  "Business Studies – Year 11",
  "Economics – Year 11",
  "History Life Skills – Year 11",
  "Ancient History – Year 12",
  "Modern History – Year 12",
  "History Extension – Year 12",
  "Geography – Year 12",
  "Legal Studies – Year 12",
  "Society and Culture – Year 12",
  "Studies of Religion I – Year 12",
  "Studies of Religion II – Year 12",
  "Aboriginal Studies – Year 12",
  "Business Studies – Year 12",
  "Economics – Year 12",
  "History Life Skills – Year 12",
  "Visual Arts – Year 11",
  "Music 1 – Year 11",
  "Music 2 – Year 11",
  "Drama – Year 11",
  "Dance – Year 11",
  "Visual Design Life Skills – Year 11",
  "Visual Arts – Year 12",
  "Music 1 – Year 12",
  "Music 2 – Year 12",
  "Music Extension – Year 12",
  "Drama – Year 12",
  "Dance – Year 12",
  "Visual Design Life Skills – Year 12",
  "Design and Technology – Year 11",
  "Engineering Studies – Year 11",
  "Enterprise – Year 11",
  "Software Engineering – Year 11",
  "Textiles and Design – Year 11",
  "Industrial Technology – Year 11",
  "Technological Life Skills – Year 11",
  "Design and Technology – Year 12",
  "Engineering Studies – Year 12",
  "Enterprise Computing – Year 12",
  "Software Engineering – Year 12",
  "Textiles and Design – Year 12",
  "Industrial Technology – Year 12",
  "Technological Life Skills – Year 12",
  "PDHPE – Year 11",
  "Community and Family Studies – Year 11",
  "Sport, Lifestyle and Recreation – Year 11",
  "PDHPE Life Skills – Year 11",
  "PDHPE – Year 12",
  "Community and Family Studies – Year 12",
  "Sport, Lifestyle and Recreation – Year 12",
  "PDHPE Life Skills – Year 12",
  "French Beginners – Year 11",
  "French Continuers – Year 11",
  "Japanese Beginners – Year 11",
  "Japanese Continuers – Year 11",
  "Chinese Beginners – Year 11",
  "Chinese Continuers – Year 11",
  "German Continuers – Year 11",
  "Spanish Beginners – Year 11",
  "Spanish Continuers – Year 11",
  "Hindi Continuers – Year 11",
  "Arabic Continuers – Year 11",
  "Classical Greek Continuers – Year 11",
  "Latin Continuers – Year 11",
  "Language Life Skills – Year 11",
  "French Beginners – Year 12",
  "French Continuers – Year 12",
  "French Extension – Year 12",
  "Japanese Beginners – Year 12",
  "Japanese Continuers – Year 12",
  "Japanese Extension – Year 12",
  "Chinese Beginners – Year 12",
  "Chinese Continuers – Year 12",
  "Chinese Extension – Year 12",
  "Chinese and Literature – Year 12",
  "German Continuers – Year 12",
  "German Extension – Year 12",
  "Spanish Beginners – Year 12",
  "Spanish Continuers – Year 12",
  "Spanish Extension – Year 12",
  "Hindi Extension – Year 12",
  "Arabic Extension – Year 12",
  "Classical Greek Extension – Year 12",
  "Latin Extension – Year 12",
  "Language Life Skills – Year 12",
  "VET: Construction",
  "VET: Hospitality",
  "VET: Business Services",
  "VET: Primary Industries",
  "VET: Retail Services",
  "VET: Tourism, Travel and Events",
  "VET: Information and Digital Technology",
  "VET: Human Services (Nursing)",
  "VET: Automotive",
  "VET: Electrotechnology",
  "VET: Financial Services",
  "VET: Manufacturing and Engineering",
  "IB: English A Literature HL",
  "IB: English A Literature SL",
  "IB: English Language and Literature HL",
  "IB: English Language and Literature SL",
  "IB: Literature and Performance SL",
  "IB: Language B HL",
  "IB: Language B SL",
  "IB: Language ab initio SL",
  "IB: Biology HL",
  "IB: Biology SL",
  "IB: Chemistry HL",
  "IB: Chemistry SL",
  "IB: Physics HL",
  "IB: Physics SL",
  "IB: Computer Science HL",
  "IB: Computer Science SL",
  "IB: Mathematics: Analysis and Approaches HL",
  "IB: Mathematics: Analysis and Approaches SL",
  "IB: Mathematics: Applications and Interpretation HL",
  "IB: Mathematics: Applications and Interpretation SL",
  "IB: History HL",
  "IB: History SL",
  "IB: Economics HL",
  "IB: Economics SL",
  "IB: Psychology HL",
  "IB: Psychology SL",
  "IB: Philosophy HL",
  "IB: Philosophy SL",
  "IB: Visual Arts HL",
  "IB: Visual Arts SL",
  "IB: Music HL",
  "IB: Music SL",
  "IB: Theatre HL",
  "IB: Theatre SL",
  "IB: Theory of Knowledge",
  "IB: Extended Essay",
]
const Nav: React.FC<{}> = () => {
    const [dropdown, setDropdown] = useState("");
    const [searchTerm, setSearchTerm] = useState(false);
    const filtered = suggestions.filter((s) =>
      s.toLowerCase().includes(dropdown.toLowerCase()) && dropdown.length > 0
    );
  return (
    <div className='fixed top-0 left-0 z-50 flex items-center w-full h-[60px] animate-gradient bg-gradient-to-r from-red-600 via-red-900 to-black bg-opacity-80 backdrop-blur-md text-2xl text-white'>
        <a href="/" className='pl-6 font-bold text-2xl flex items-center drop-shadow-[0_2px_2px_rgba(0,0,0,0.25)] tracking-tight whitespace-nowrap'>🌎 Student World</a>
        <div className='flex items-center justify-start w-full'>
            <div className='flex relative w-1/3 ml-70'>
                <input
                type="text"
                placeholder="Search Senior Subjects"
                className="w-full h-8 px-4 text-white rounded-full outline outline-white focus:outline-none focus:ring-2 focus:ring-red-400"
                value={dropdown}
                onChange={e => {
                    setDropdown(e.target.value);
                    setSearchTerm(true);
                }}
                onBlur={() => setTimeout(() => setSearchTerm(false), 100)}
                onFocus={() => dropdown && setSearchTerm(true)}
                />
                {searchTerm && filtered.length > 0 && (
                <ul className="absolute left-0 right-0 top-full mt-2 bg-white text-black rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                    {filtered.map((item, idx) => (
                    <li
                        key={idx}
                        className="px-4 py-2 hover:bg-red-100 cursor-pointer"
                        onMouseDown={() => {
                        setDropdown(item);
                        setSearchTerm(false);
                        }}
                    >
                        {item}
                    </li>
                    ))}
                </ul>
                )}
            </div>
        <a href="/" className='pl-35 text-white hover:text-red-400 transition-colors duration-300 text-base'>Home</a>
        <a href="https://www.apple.com" className='pl-8 text-white hover:text-red-400 transition-colors duration-300 text-base'>Learn</a>
        <a href="/about" className='pl-8 text-white hover:text-red-400 transition-colors duration-300 text-base'>About</a>
        <a href="/signin" className='ml-8 mr-6 px-4 py-1 border border-red-400 rounded-full text-white hover:text-red-400 hover:border-white transition-all duration-300 text-base shadow-sm'>Sign In</a>

        </div>
        <div className="absolute left-0 bottom-0 w-full h-[2px] animate-gradient bg-gradient-to-r from-black via-blue-700 to-blue-400"></div>
    </div>
  )
}

export default Nav
