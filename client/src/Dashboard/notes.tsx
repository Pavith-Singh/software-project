import React, { useState, Fragment, ChangeEvent, useEffect } from 'react'
import { FaSpinner } from 'react-icons/fa'
import Sidebar from '../components/Nav/Sidebar'
import { Combobox, Listbox, Transition } from '@headlessui/react'
import { suggestions } from '../components/Nav/Nav'
import { FaPen } from 'react-icons/fa'
import { AiOutlinePlus } from 'react-icons/ai'
import Fuse from 'fuse.js'
import { db, storage } from '../firebase/firebase'
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import {
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage'

const types = ['Notes', 'Internal Assessment', 'Trials/Prelim', 'Finals Question Bank', 'Videos']
const years = Array.from({ length: 25 }, (_, i) => (2001 + i).toString())

type Resource = {
  id: string
  subject: string
  type: string
  year: string
  title: string
  keywordTags: string[]
  url: string
  format: 'pdf' | 'video'
}

const staticResources: Resource[] = [
  {
    id: '1',
    subject: 'Physics – Year 12',
    type: 'Notes',
    year: '2019',
    title: 'Pearson Physics 12',
    keywordTags: ['motion', 'pearson', 'physics', 'year 12', 'HSC', 'textbook'],
    url: '/resources/pearson-physics-12.pdf',
    format: 'pdf',
  },
  {
    id: '2',
    subject: 'Biology – Year 12',
    type: 'Videos',
    year: '2021',
    title: 'HSC Biology: Module 6 Masterclass | Genetic Change',
    keywordTags: ['cell', 'biology', 'genetics', 'masterclass', 'genetic change', 'HSC', 'module 6'],
    url: 'https://www.youtube.com/embed/5HPMJ26RDcQ',
    format: 'video',
  },
  {
    id: '3',
    subject: 'Software Engineering – Year 11',
    type: 'Internal Assessment',
    year: '2024',
    title: 'Software Assessment 1 Theory — The Ponds High School',
    keywordTags: ['Programming Fundamentals', 'The Ponds High School', 'Assessment Task', 'Theory'],
    url: '/resources/software-assessment-1-theory.pdf',
    format: 'pdf',
  },
  {
    id: '4',
    subject: 'IB: Mathematics: Applications and Interpretation HL',
    type: 'Videos',
    year: '2020',
    title: 'Differential Calculus',
    keywordTags: ['trigonometry', 'angles', 'sine', 'cosine', 'tangent'],
    url: 'https://www.youtube.com/embed/DcU5r2_TdWU',
    format: 'video',
  },
  {
    id: '5',
    subject: 'Mathematics Extension 1 – Year 11',
    type: 'Notes',
    year: '2020',
    title: 'Mathematics Extension 1 - Year 11 In Focus',
    keywordTags: ['Maths', 'Extension 1', 'Year 11', 'In Focus', 'Textbook', 'Preliminary'],
    url: '/resources/Year 11 Extension Maths In Focus.pdf',
    format: 'pdf',
  },
  {
    id: '6',
    subject: 'Physics – Year 12',
    type: 'Internal Assessment',
    year: '2025',
    title: 'Module 8 Notes - The Ponds High School',
    keywordTags: ['Notes', 'Physics', 'Year 12', 'Module 8', 'HSC', 'The Ponds High School'],
    url: '/resources/From The Universe to The Atom.pdf',
    format: 'pdf',
  },
  {
    id: '7',
    subject: 'Software Engineering – Year 12',
    type: 'Internal Assessment',
    year: '2025',
    title: 'Cyber Security Depth Study',
    keywordTags: ['Notes', 'Software', 'Year 12', 'Software Secure Architecture', 'HSC', 'The Ponds High School'],
    url: '/resources/Optus Cyberattack Report.pdf',
    format: 'pdf',
  },
]

const Notes: React.FC = () => {
  const [resourceList, setResourceList] = useState<Resource[]>(staticResources)
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeResource, setActiveResource] = useState<Resource | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [newResource, setNewResource] = useState({
    title: '',
    subject: '',
    type: '',
    year: '',
    keywordTags: '',
    fileType: 'pdf',
    file: null as File | null,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'resources'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Resource, 'id'>) }))
      setResourceList([...staticResources, ...data])
    })
    return unsub
  }, [])

  const subjectFuse = new Fuse(suggestions, { threshold: 0.45, includeScore: true })
  const subjectSearch = selectedSubject.trim()
  const filteredSubjects =
    subjectSearch === ''
      ? suggestions
      : subjectFuse.search(subjectSearch).map(r => r.item)

  const fuse = new Fuse(resourceList, {
    keys: ['title', 'subject', 'type', 'year', 'keywordTags'],
    threshold: 0.4,
    includeScore: true,
  })
  const fuseResults = searchTerm ? fuse.search(searchTerm).map(r => r.item) : resourceList
  const filteredResources = fuseResults.filter(res =>
    (selectedSubject === '' || res.subject.toLowerCase().includes(selectedSubject.toLowerCase())) &&
    (selectedType === '' || res.type === selectedType) &&
    (selectedYear === '' || res.year === selectedYear)
  )

  const handleAdd = async () => {
    setIsLoading(true)
    if (
      newResource.title &&
      newResource.subject &&
      newResource.type &&
      newResource.year &&
      newResource.file
    ) {
      const fileRef = sRef(storage, `resources/${Date.now()}-${newResource.file.name}`)
      await uploadBytes(fileRef, newResource.file)
      const url = await getDownloadURL(fileRef)
      await addDoc(collection(db, 'resources'), {
        title: newResource.title,
        subject: newResource.subject,
        type: newResource.type,
        year: newResource.year,
        keywordTags: newResource.keywordTags.split(',').map(t => t.trim()),
        url,
        format: newResource.fileType === 'mp4' ? 'video' : 'pdf',
        createdAt: serverTimestamp(),
      })
      setNewResource({ title: '', subject: '', type: '', year: '', keywordTags: '', fileType: 'pdf', file: null })
      setPreviewUrl('')
      setShowAddForm(false)
      setIsLoading(false)
    } else {
      alert('Please fill all fields and upload a PDF.')
      setIsLoading(false)
    }
  }

  const addSubjectFuse = new Fuse(suggestions, { threshold: 0.45, includeScore: true })
  const addSubjectSearch = newResource.subject.trim()
  const addFilteredSubjects =
    addSubjectSearch === ''
      ? suggestions
      : addSubjectFuse.search(addSubjectSearch).map(r => r.item)

  return (
    <div className="flex w-full h-screen bg-gray-900 text-white">
      <div className="ml-16 flex-1 p-6 overflow-auto">
        <Sidebar />
        <h1 className="text-2xl font-semibold mb-4">
          <FaPen size={20} className="inline mr-2 mb-0.5" />Notes
        </h1>
        <div className="mb-4">
          <button
            onClick={() => setShowAddForm(true)}
            className="p-2 text-black bg-white opacity-75 hover:bg-gray-200 opacity-60 rounded cursor-pointer"
          >
            <AiOutlinePlus size={24} />
          </button>
        </div>
        {showAddForm && (
          <div className="mb-6 p-4 bg-gray-800 rounded border border-gray-700">
            <h2 className="text-lg font-semibold mb-4">Add New PDF Resource</h2>
            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Title"
                value={newResource.title}
                onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded"
              />
              <Combobox
                value={newResource.subject || null}
                onChange={(v: string | null) =>
                  setNewResource({ ...newResource, subject: v ?? '' })
                }
              >
                <div className="relative">
                  <Combobox.Input
                    className="w-full px-4 py-2 border border-gray-600 bg-gray-700 text-white rounded focus:outline-none"
                    placeholder="Select Subject"
                    value={newResource.subject}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setNewResource({ ...newResource, subject: e.target.value })
                    }
                  />
                  <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-gray-700 border border-gray-600 rounded shadow-lg">
                      {addFilteredSubjects.map((s, idx) => (
                        <Combobox.Option
                          key={idx}
                          value={s}
                          className={({ active }) =>
                            `cursor-pointer select-none p-2 ${active ? 'bg-red-600 text-white' : 'text-gray-300'}`
                          }
                        >
                          {s}
                        </Combobox.Option>
                      ))}
                    </Combobox.Options>
                  </Transition>
                </div>
              </Combobox>
              <select
                value={newResource.type}
                onChange={e => setNewResource({ ...newResource, type: e.target.value })}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded cursor-pointer"
              >
                <option value="">Select Type</option>
                {types.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={newResource.year}
                onChange={e => setNewResource({ ...newResource, year: e.target.value })}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded cursor-pointer"
              >
                <option value="">Select Year</option>
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Tags (comma separated)"
                value={newResource.keywordTags}
                onChange={e => setNewResource({ ...newResource, keywordTags: e.target.value })}
                className="px-4 py-2 bg-gray-700 border border-gray-600 text-white rounded"
              />
              <label className="flex items-center gap-2 mb-2">
                <span className="text-white">Select File Type:</span>
                <select
                  value={newResource.fileType}
                  onChange={e => setNewResource({ ...newResource, fileType: e.target.value })}
                  className="px-2 py-1 bg-gray-700 border border-gray-600 text-white rounded"
                >
                  <option value="pdf">PDF</option>
                  <option value="mp4">MP4</option>
                </select>
              </label>
              <label className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded cursor-pointer text-center">
                Choose File
                <input
                  type="file"
                  accept={newResource.fileType === 'pdf' ? '.pdf' : '.mp4'}
                  onChange={e => {
                    const file = e.target.files?.[0] ?? null
                    setNewResource({ ...newResource, file })
                    if (file) setPreviewUrl(URL.createObjectURL(file))
                  }}
                  className="hidden"
                />
              </label>
              {previewUrl && (
                <iframe src={previewUrl} className="w-full h-64 border rounded" title="preview" />
              )}
              <div className="flex gap-3">
                <button
                  onClick={handleAdd}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <FaSpinner className="animate-spin inline-block mr-2" />
                      Adding...
                    </>
                  ) : (
                    'Add'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false)
                    setPreviewUrl('')
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="w-72">
            <Combobox
              value={selectedSubject || null}
              onChange={(v: string | null) => setSelectedSubject(v ?? '')}
            >
              <div className="relative">
                <Combobox.Input
                  className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded focus:outline-none focus:ring-2 focus:ring-red-400"
                  placeholder="Select Subject"
                  value={selectedSubject}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedSubject(e.target.value)}
                />
                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                  <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto bg-gray-800 border border-gray-700 rounded shadow-lg">
                    {filteredSubjects.map((s, idx) => (
                      <Combobox.Option
                        key={idx}
                        value={s}
                        className={({ active }) =>
                          `cursor-pointer select-none p-2 ${active ? 'bg-red-600 text-white' : 'text-gray-300'}`
                        }
                      >
                        {s}
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
                <Listbox.Button className="w-full px-4 py-2 border border-gray-600 bg-gray-800 text-left text-white rounded cursor-pointer">
                  {selectedType || 'Select Type'}
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100">
                  <Listbox.Options className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded shadow-lg">
                    {types.map((t, idx) => (
                      <Listbox.Option
                        key={idx}
                        value={t}
                        className={({ active }) =>
                          `cursor-pointer select-none p-2 ${active ? 'bg-red-600 text-white' : 'text-gray-300'}`
                        }
                      >
                        {t}
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
                <Listbox.Button className="w-full max-h-60 overflow-auto px-4 py-2 border border-gray-600 bg-gray-800 text-left text-white rounded cursor-pointer">
                  {selectedYear || 'Select Year'}
                </Listbox.Button>
                <Transition as={Fragment} leave="transition ease-in duration-100">
                  <Listbox.Options className="absolute z-10 mt-1 w-full max-h-60 overflow-auto bg-gray-800 border border-gray-700 rounded shadow-lg">
                    {years.map((y, idx) => (
                      <Listbox.Option
                        key={idx}
                        value={y}
                        className={({ active }) =>
                          `cursor-pointer select-none p-2 ${active ? 'bg-red-600 text-white' : 'text-gray-300'}`
                        }
                      >
                        {y}
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
            onChange={e => setSearchTerm(e.target.value)}
            className="px-4 py-2 border border-gray-600 bg-gray-800 text-white rounded flex-1 min-w-[200px]"
          />
        </div>
        <div className="bg-gray-800 p-4 rounded shadow border border-gray-700 mb-4">
          <p>
            Showing results for <strong>{selectedSubject || 'All Subjects'}</strong>,{' '}
            <strong>{selectedType || 'All Types'}</strong>,{' '}
            <strong>{selectedYear || 'All Years'}</strong>{' '}
            {searchTerm && <>with keyword <strong>“{searchTerm}”</strong></>}.
          </p>
        </div>
        {filteredResources.length === 0 ? (
          <div className="bg-gray-800 p-4 rounded shadow text-center text-gray-400 border border-gray-700">
            No resources found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredResources.map(res => (
              <div
                key={res.id}
                onClick={() => setActiveResource(res)}
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
        {activeResource && (
          <div className="mt-6 bg-gray-800 p-4 rounded border border-gray-700">
            <h2 className="text-xl font-semibold mb-2">{activeResource.title}</h2>
            <button
              onClick={() => setActiveResource(null)}
              className="cursor-pointer mb-4 px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-700 rounded"
            >
              Close Preview
            </button>
            {activeResource.format === 'pdf' ? (
              <iframe src={activeResource.url} className="w-full h-[80vh] border rounded" title={activeResource.title} />
            ) : (
              <iframe
                src={activeResource.url}
                className="w-full h-[80vh] border rounded"
                title={activeResource.title}
                allowFullScreen
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Notes