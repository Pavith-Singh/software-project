import React, { useState, Fragment, ChangeEvent } from 'react';
import Sidebar from '../components/Nav/Sidebar';
import { Combobox, Listbox, Transition } from '@headlessui/react';
import { suggestions } from '../components/Nav/Nav';
import { FaPen } from 'react-icons/fa';
import Fuse from 'fuse.js';

const types = ['Notes', 'Internal Assessment', 'Trials/Prelim', 'Finals Question Bank', 'Videos'];
const years = ['2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024', '2025'];

type Resource = {
  id: string;
  subject: string;
  type: string;
  year: string;
  title: string;
  keywordTags: string[];
  url: string;
  format: 'pdf' | 'video';
};

const resources: Resource[] = [
  {
    id: 'r1',
    subject: 'Physics – Year 12',
    type: 'Notes',
    year: '2025',
    title: 'Projectile Motion Summary',
    keywordTags: ['motion', 'projectile', 'kinematics'],
    url: '/resources/projectile-motion.pdf',
    format: 'pdf',
  },
  {
    id: 'r2',
    subject: 'Biology – Year 11',
    type: 'Videos',
    year: '2024',
    title: 'Cell Structure Explained',
    keywordTags: ['cell', 'biology', 'organelles'],
    url: 'https://www.youtube.com/embed/exampleVideo',
    format: 'video',
  },
  {
    id: 'r3',
    subject: 'Chemistry - Year 11',
    type: 'Notes',
    year: '2023',
    title: 'Acids and Bases',
    keywordTags: ['chemistry', 'acids', 'bases'],
    url: '/resources/acids-and-bases.pdf',
    format: 'pdf',
  },
  {
    id: 'r4',
    subject: 'IB: Mathematics: Applications and Interpretation HL',
    type: 'Notes',
    year: '2022',
    title: 'Trigonometry',
    keywordTags: ['trigonometry', 'angles', 'sine', 'cosine', 'tangent'],
    url: '/resources/trigonometry.pdf',
    format: 'pdf',
  }
];




const Notes: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const subjectFuse = new Fuse(suggestions, {
    threshold: 0.45,
    includeScore: true,
  });

  const filteredSubjects =
    selectedSubject && selectedSubject.trim() !== ''
      ? subjectFuse.search(selectedSubject).map(result => result.item)
      : suggestions;
  const fuse = new Fuse(resources, {
    keys: ['title', 'subject', 'type', 'year', 'keywordTags'],
    threshold: 0.4,
    includeScore: true,
  });
  const baseFiltered = resources.filter(
    (res) =>
      (!selectedSubject || res.subject === selectedSubject) &&
      (!selectedType || res.type === selectedType) &&
      (!selectedYear || res.year === selectedYear)
  );

  const fuseResults = searchTerm
    ? fuse.search(searchTerm).map(result => result.item)
    : resources;

  const filteredResources = fuseResults.filter((res) =>
    (!selectedSubject || res.subject.toLowerCase().includes(selectedSubject.toLowerCase())) &&
    (!selectedType || res.type === selectedType) &&
    (!selectedYear || res.year === selectedYear)
  );

  return (
    <div className="flex w-full h-screen bg-gray-900 text-white">
      <div className="ml-16 flex-1 p-6 overflow-auto">
        <Sidebar />
        <h1 className="text-2xl font-semibold mb-4"><FaPen size={20} className="inline mr-2 mb-0.5" />Notes</h1>
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="w-72">
            <Combobox value={selectedSubject} onChange={setSelectedSubject}>
              <div className="relative">
                <Combobox.Input
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Select Subject"
                  value={selectedSubject ?? ''}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    setSelectedSubject(e.target.value)
                  }
                />
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-gray-800 border border-gray-700 rounded shadow-lg">
                    {filteredSubjects.map((subject, idx) => (
                      <Combobox.Option
                        key={idx}
                        value={subject}
                        className={({ active }: { active: boolean }) =>
                          `cursor-pointer select-none p-2 ${
                            active ? 'bg-red-600 text-white' : 'text-gray-300'
                          }`
                        }
                      >
                        {subject}
                      </Combobox.Option>
                    ))}
                  </Combobox.Options>
                </Transition>
              </div>
            </Combobox>
          </div>

          <div className="w-56">
            <Listbox value={selectedType} onChange={setSelectedType}>
              <div className="relative">
                <Listbox.Button className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-left text-white rounded">
                  {selectedType || 'Select Type'}
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100">
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow-lg">
                    {types.map((type, idx) => (
                      <Listbox.Option
                        key={idx}
                        value={type}
                        className={({ active }: { active: boolean }) =>
                          `cursor-pointer select-none p-2 ${
                            active ? 'bg-red-600 text-white' : 'text-gray-300'
                          }`
                        }
                      >
                        {type}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>
          <div className="w-40">
            <Listbox value={selectedYear} onChange={setSelectedYear}>
              <div className="relative">
                <Listbox.Button className="w-full max-h-60 overflow-auto px-4 py-2 border border-gray-600 bg-gray-800 text-left text-white rounded">
                  {selectedYear || 'Select Year'}
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100">
                  <Listbox.Options className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-gray-800 border border-gray-700 rounded shadow-lg">
                    {years.map((year, idx) => (
                      <Listbox.Option
                        key={idx}
                        value={year}
                        className={({ active }: { active: boolean }) =>
                          `cursor-pointer select-none p-2 ${
                            active ? 'bg-red-600 text-white' : 'text-gray-300'
                          }`
                        }
                      >
                        {year}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
          </div>

          <input
            type="text"
            placeholder="Search by keyword"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded flex-1 min-w-[200px]"
          />
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 p-4 rounded shadow border border-gray-700">
            <p>
              Showing results for <strong>{selectedSubject ?? 'All Subjects'}</strong>,{' '}
              <strong>{selectedType || 'All Types'}</strong>,{' '}
              <strong>{selectedYear || 'All Years'}</strong>{' '}
              {searchTerm && (
                <>
                  with keyword <strong>“{searchTerm}”</strong>
                </>
              )}
              .
            </p>
          </div>
          {filteredResources.length === 0 ? (
            <div className="bg-gray-800 p-4 rounded shadow text-center text-gray-400 border border-gray-700">
              No resources found.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map((res) => (
                <div
                  key={res.id}
                  className="bg-gray-800 hover:bg-gray-700 cursor-pointer transition p-4 rounded border border-gray-700"
                >
                  <h2 className="font-semibold text-lg">{res.title}</h2>
                  <p className="text-sm text-gray-400">
                    {res.subject} · {res.type} · {res.year}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notes;