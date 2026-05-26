import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';

function App() {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState('');
  const [response, setResponse] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState('');

  useEffect(() => {
    document.title = '0827AL231056';
  }, []);

  const options = [
    { value: 'Numbers', label: 'Numbers' },
    { value: 'Alphabets', label: 'Alphabets' },
    {
      value: 'Highest lowercase alphabet',
      label: 'Highest lowercase alphabet'
    }
  ];

  const loadSample = () => {
    setJsonInput(
`{
  "data": [
    "M",
    "1",
    "334",
    "4",
    "B",
    "Z",
    "a",
    "7"
  ]
}`
    );
  };

  const handleSubmit = async () => {
    setError('');
    setResponse(null);
    setLoading(true);

    try {
      const sanitizedInput = jsonInput
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");

      if (!sanitizedInput.trim()) {
        throw new Error('Please enter JSON input.');
      }

      let parsed;

      try {
        parsed = JSON.parse(sanitizedInput);
      } catch {
        throw new Error('Invalid JSON format.');
      }

      if (!parsed.data || !Array.isArray(parsed.data)) {
        throw new Error(
          'JSON must contain a valid data array.'
        );
      }

      const backendUrl =
        import.meta.env.VITE_BACKEND_URL ;

      const res = await axios.post(backendUrl, parsed);

      if (res.data?.is_success) {
        setResponse(res.data);
      } else {
        throw new Error('API request failed.');
      }

    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        'Connection error.'
      );
    } finally {
      setLoading(false);
    }
  };

  const isSelected = (key) => {
    if (selectedOptions.length === 0) return true;

    return selectedOptions.some(
      (item) => item.value === key
    );
  };

  const renderResponse = () => {
    if (!response) return null;

    return (
      <div className="mt-8 space-y-6 animate-[fadeIn_0.4s_ease]">

        {/* Response Card */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">
              Filtered Response
            </h2>

            <div className="h-1 w-20 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />
          </div>

          <div className="space-y-6">

            {/* Numbers */}
            {isSelected('Numbers') && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Numbers
                </h3>

                <div className="flex flex-wrap gap-2">
                  {response.numbers?.length > 0 ? (
                    response.numbers.map((item, index) => (
                      <span
                        key={index}
                        className="rounded-xl border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-300"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      No numbers found
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Alphabets */}
            {isSelected('Alphabets') && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Alphabets
                </h3>

                <div className="flex flex-wrap gap-2">
                  {response.alphabets?.length > 0 ? (
                    response.alphabets.map((item, index) => (
                      <span
                        key={index}
                        className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-300"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      No alphabets found
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Highest lowercase alphabet */}
            {isSelected('Highest lowercase alphabet') && (
              <div>
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
                  Highest Lowercase Alphabet
                </h3>

                <div className="flex flex-wrap gap-2">
                  {response.highest_lowercase_alphabet?.length > 0 ? (
                    response.highest_lowercase_alphabet.map((item, index) => (
                      <span
                        key={index}
                        className="rounded-xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-300"
                      >
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-slate-500">
                      No lowercase alphabet found
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Technical Details */}
          <div className="mt-8 grid grid-cols-2 gap-5 border-t border-white/10 pt-6 md:grid-cols-4">

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
                Prime Found
              </p>

              <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                response.is_prime_found
                  ? 'border border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                  : 'border border-white/10 bg-white/[0.04] text-slate-400'
              }`}>
                {response.is_prime_found ? 'YES' : 'NO'}
              </span>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
                File Valid
              </p>

              <span className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                response.file_valid
                  ? 'border border-indigo-400/20 bg-indigo-500/10 text-indigo-300'
                  : 'border border-white/10 bg-white/[0.04] text-slate-400'
              }`}>
                {response.file_valid ? 'YES' : 'NO'}
              </span>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
                MIME Type
              </p>

              <span className="text-sm text-slate-300">
                {response.file_mime_type || 'N/A'}
              </span>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wider text-slate-500">
                File Size
              </p>

              <span className="text-sm text-slate-300">
                {response.file_size_kb || '0'} KB
              </span>
            </div>
          </div>
        </div>

        {/* Footer User Info */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
          <div className="flex flex-col gap-3 text-sm text-slate-400 md:flex-row md:justify-between">
            <p>
              User ID:{' '}
              <span className="font-medium text-slate-200">
                {response.user_id}
              </span>
            </p>

            <p>
              Email:{' '}
              <span className="font-medium text-slate-200">
                {response.email}
              </span>
            </p>

            <p>
              Roll No:{' '}
              <span className="font-medium text-slate-200">
                {response.roll_number}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#060816] text-white">

      {/* Ambient Background */}
      <div className="absolute top-0 left-1/2 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-indigo-500/10 blur-3xl" />

      <div className="absolute bottom-0 right-0 h-[300px] w-[300px] rounded-full bg-violet-500/10 blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10">

        <div className="w-full rounded-[32px] border border-white/10 bg-white/[0.04] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl md:p-10">

          {/* Header */}
          <div className="text-center">

            <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
              Bajaj Finserv Health Challenge
            </h1>

            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400" />

            <p className="mt-5 text-sm text-slate-400">
              Roll Number: 0827AL231056
            </p>
          </div>

          {/* Main Content */}
          <div className="mt-10 space-y-6">

            {/* JSON Input */}
            <div className="rounded-3xl border border-white/10 bg-[#0b1120] p-5">

              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  API Request JSON Input
                </h2>

                <button
                  onClick={loadSample}
                  className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-slate-300 transition-all hover:bg-white/[0.08]"
                >
                  Load Sample
                </button>
              </div>

              <textarea
                rows="10"
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{ "data": ["A", "1", "z"] }'
                className="
                  w-full
                  resize-none
                  rounded-2xl
                  border
                  border-white/10
                  bg-[#060816]
                  px-5
                  py-4
                  font-mono
                  text-sm
                  text-slate-200
                  outline-none
                  transition-all
                  duration-300
                  placeholder:text-slate-500
                  focus:border-indigo-400/40
                  focus:ring-4
                  focus:ring-indigo-500/10
                "
              />
            </div>

            {/* Upload Box */}
            <div className="rounded-3xl border border-white/10 bg-[#0b1120] p-5">

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                <div>
                  <p className="text-sm font-medium text-slate-300">
                    Upload Test File (Optional)
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Converts file to Base64 for API
                  </p>
                </div>

                <label className="
                  cursor-pointer
                  rounded-xl
                  border
                  border-white/10
                  bg-white/[0.05]
                  px-5
                  py-3
                  text-sm
                  text-slate-300
                  transition-all
                  hover:bg-white/[0.08]
                ">
                  Choose File

                  <input
                    type="file"
                    hidden
                    onChange={(e) =>
                      setFileName(
                        e.target.files?.[0]?.name || ''
                      )
                    }
                  />
                </label>
              </div>

              {fileName && (
                <p className="mt-4 text-sm text-slate-400">
                  Selected File:{' '}
                  <span className="text-slate-200">
                    {fileName}
                  </span>
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="
                w-full
                rounded-2xl
                bg-gradient-to-r
                from-indigo-500
                to-violet-500
                py-4
                text-base
                font-semibold
                text-white
                transition-all
                duration-300
                hover:scale-[1.01]
                hover:shadow-xl
                hover:shadow-indigo-500/20
                active:scale-[0.99]
                disabled:opacity-50
              "
            >
              {loading
                ? 'Processing Request...'
                : 'Submit Request'}
            </button>

            {/* Error */}
            {error && (
              <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Filter */}
            {response && (
              <div className="rounded-3xl border border-white/10 bg-[#0b1120] p-5">

                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-300">
                  Multi-Select Filter
                </h2>

                <Select
                  isMulti
                  options={options}
                  onChange={setSelectedOptions}
                  placeholder="Select response filters..."
                  components={{
                    IndicatorSeparator: () => null
                  }}
                  styles={{
                    control: (base, state) => ({
                      ...base,
                      backgroundColor: '#060816',
                      borderColor: state.isFocused
                        ? '#818cf8'
                        : 'rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      minHeight: '56px',
                      boxShadow: 'none',
                      color: '#fff',
                      padding: '6px'
                    }),

                    menu: (base) => ({
                      ...base,
                      backgroundColor: '#0b1120',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '16px',
                      overflow: 'hidden'
                    }),

                    option: (base, state) => ({
                      ...base,
                      backgroundColor: state.isFocused
                        ? 'rgba(99,102,241,0.15)'
                        : 'transparent',
                      color: '#fff',
                      cursor: 'pointer'
                    }),

                    multiValue: (base) => ({
                      ...base,
                      backgroundColor: 'rgba(99,102,241,0.15)',
                      borderRadius: '10px'
                    }),

                    multiValueLabel: (base) => ({
                      ...base,
                      color: '#e2e8f0'
                    }),

                    multiValueRemove: (base) => ({
                      ...base,
                      color: '#94a3b8',
                      ':hover': {
                        backgroundColor: 'rgba(239,68,68,0.15)',
                        color: '#ef4444'
                      }
                    }),

                    input: (base) => ({
                      ...base,
                      color: '#fff'
                    }),

                    placeholder: (base) => ({
                      ...base,
                      color: '#64748b'
                    })
                  }}
                />
              </div>
            )}

            {/* Response */}
            {renderResponse()}

            {/* Footer */}
            <footer className="pt-4 text-center text-xs text-slate-500">
              
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;