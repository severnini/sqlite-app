import * as FileSystem from 'expo-file-system'
import * as SQLite from 'expo-sqlite'

import { StyleSheet, Text, View } from 'react-native'
import { useEffect, useState } from 'react'

import { Asset } from 'expo-asset'
import { StatusBar } from 'expo-status-bar'

async function openDatabase() {
  if (!(await FileSystem.getInfoAsync(FileSystem.documentDirectory + 'SQLite')).exists) {
    await FileSystem.makeDirectoryAsync(FileSystem.documentDirectory + 'SQLite')
  }
  await FileSystem.downloadAsync(
    Asset.fromModule(require('./assets/data/data.db')).uri,
    FileSystem.documentDirectory + 'SQLite/data.db'
  )

  return SQLite.openDatabase('data.db');
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

        tx.executeSql('select * from classes order by nm_nome', [], (_, { rows }) => {
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
    }).catch( (openDbError) => {
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
