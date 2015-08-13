file = open('/Users/Lipman/Developer-Files/CI/cranialFacialDataStuff/facial_norms/tdfn_gui_summary.csv')
newFile = open('/Users/Lipman/Developer-Files/CI/cranialFacialDataStuff/facial_norms/newSummary', 'w+')
newFile.write('{')
for line in file:
    print line
    spiltLine = line.split(',')
    newFile.write("'" + spiltLine[1] + "': [")
    newFile.write(spiltLine[2] + ',')
    newFile.write(spiltLine[3] + ',')
    newFile.write(spiltLine[4] + ',')
    newFile.write(spiltLine[5] + ',')
    newFile.write(spiltLine[6] + ',')
    newFile.write(spiltLine[7] + '],\n')
#id,field,age_floor,age_ceiling,sex,n,mean,sd
