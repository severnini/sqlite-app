import * as FileSystem from 'expo-file-system'
import * as SQLite from 'expo-sqlite'

import {
  StyleSheet,
  Text,
  View
} from 'react-native'
import {
  useEffect,
  useState
} from 'react'

import {
  Asset
} from 'expo-asset'
import {
  StatusBar
} from 'expo-status-bar'

async function openDatabase() {

  const localFolder = FileSystem.documentDirectory + 'SQLite'
  const dbName = 'data.db'
  const localURI = localFolder + '/' + dbName

  if (!(await FileSystem.getInfoAsync(localFolder)).exists) {
    await FileSystem.makeDirectoryAsync(localFolder)
  }

  let asset = Asset.fromModule(require('./assets/data/data.db'))

  if (!asset.downloaded) {
    await asset.downloadAsync().then(value => {
      asset = value
      console.log('asset downloadAsync - finished')
    })

    let remoteURI = asset.localUri

    await FileSystem.copyAsync({
        from: remoteURI,
        to: localURI
    }).catch(error => {
        console.log('asset copyDatabase - finished with error: ' + error)
    })
  } else {
    // for iOS - Asset is downloaded on call Asset.fromModule(), just copy from cache to local file
    if (asset.localUri || asset.uri.startsWith("asset") || asset.uri.startsWith("file")) {

      let remoteURI = asset.localUri || asset.uri

      await FileSystem.copyAsync({
        from: remoteURI,
        to: localURI
      }).catch(error => {
        console.log("local copyDatabase - finished with error: " + error)
      })
    } else if (asset.uri.startsWith("http") || asset.uri.startsWith("https")) {
      let remoteURI = asset.uri

      await FileSystem.downloadAsync(remoteURI, localURI)
        .catch(error => {
          console.log("local downloadAsync - finished with error: " + error)
        })
    }
  }

  return SQLite.openDatabase(dbName)
}

export default function App() {

  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [errorMsg, setErrorMsg] = useState(false)

  useEffect(() => {
    setLoading(true)

    // Load data
    openDatabase().then(db => {
      console.log('open database')

      db.transaction(tx => {
        console.log('transaction')

        tx.executeSql('select * from classes order by nm_nome', [], (_, {
          rows
        }) => {
          let items = []

          // simulate an slow load
          setTimeout(() => {
            console.log('delayed 3s')
            for (let i = 0; i < rows.length; i++) {
              items.push(rows.item(i))
            }

            setData(items)
            setLoading(false)
          }, 3000)

        }, (sqlError) => {
          console.log("SQL Error")
          console.log(sqlError)
          setLoading(false)
          setHasError(true)
          setErrorMsg(sqlError)
        })
      }, (txError) => {
        console.log("Transaction Error")
        console.log(txError)
        setLoading(false)
        setHasError(true)
        setErrorMsg(txError)
      })
    }).catch((openDbError) => {
      console.log("Database Error")
      setLoading(false)
      setHasError(true)
      setErrorMsg(openDbError)
    })
  }, [])

  return (
    <View style={styles.container}>
      <Text key={'title'}>SQLite test app</Text>

      {loading ?
        <Text key={'loading'}>Loading...</Text>
        : hasError ?
          <Text key={'error'}>Error occured: {errorMsg}</Text>
          : (data.map(row => <Text key={row['id']}>{row['nm_nome']}</Text>))
      }
      <StatusBar style="auto" />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})