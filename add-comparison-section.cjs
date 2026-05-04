const fs = require('fs');

const filePath = 'client/src/pages/PharmacologyDashboard.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find the position after Medicine Disadvantage closing tag  
const searchPattern = `                )}
              </div>
            </div>
          )}`;

const replacement = `                )}

                {/* Comparison Section */}
                {(medicine as any).comparison && (
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold text-gray-700 text-sm">Comparison</span>
                    </div>
                    <Tooltip delayDuration={100}>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          <div className="whitespace-pre-line space-y-1">
                            {((medicine as any).comparison as string).split('\\n').map((line, index) => {
                              const trimmed = line.trim();
                              if (trimmed.startsWith('➥')) {
                                return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                              }
                              return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                            })}
                          </div>
                          <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                            <span>Click to read full comparison</span>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-md p-4 bg-white shadow-lg border border-gray-200">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 mb-2">
                            <BarChart3 className="w-5 h-5 text-gray-600" />
                            <span className="font-semibold text-gray-700">Comparison</span>
                          </div>
                          <div className="whitespace-pre-line space-y-1">
                            {((medicine as any).comparison as string).split('\\n').map((line, index) => {
                              const trimmed = line.trim();
                              if (trimmed.startsWith('➥')) {
                                return <div key={index} style={{ fontSize: '13px' }} className="ml-4">{line}</div>;
                              }
                              return <div key={index} style={{ fontSize: '14px' }}>{line}</div>;
                            })}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 italic">
                            Comparative analysis with other medicines
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                )}
              </div>
            </div>
          )}`;

content = content.replace(searchPattern, replacement);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Comparison section added successfully!');
