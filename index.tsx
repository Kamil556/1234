import Head from 'next/head'
import Header from '../components/Header'
import CountdownBar from '../components/CountdownBar'
import withAuth from '../components/withAuth'
import styles from './index.module.css'

function HomePage() {
  return (
    <>
      <Head><title>Marathon Skills 2026</title></Head>
      <div className={styles.page}>
        <Header showAdmin showParticipants showRegister />

        <div className={styles.scroll}>
          <p className={styles.ptitle}>Информация о Marathon Skills 2026</p>
          <div className={styles.layout}>

            {/* Mosaic photos */}
            <div className={styles.mosaic}>
              <div className={styles.photoMain}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1513593771513-7b58b6c4af38?w=900&q=80"
                  alt="Марафон"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
              <div className={styles.photoSm}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=500&q=80"
                  alt="Медали"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
              <div className={styles.photoSm}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=500&q=80"
                  alt="Бегунья"
                  onError={(e) => (e.currentTarget.style.display = 'none')}
                />
              </div>
            </div>

            <div /> {/* spacer */}

            {/* Text */}
            <div className={styles.text}>
              <p>
                Марафон — это не просто забег на дистанцию <strong>42,195 км</strong>. Это ежегодный
                ритуал, который объединяет профессиональных атлетов, любителей и тысячи зрителей в
                едином порыве воли и выносливости.
              </p>
              <p>
                Примерно на <strong>30–35 километре</strong> многие бегуны сталкиваются с явлением,
                которое называют «стеной». Запасы гликогена в мышцах истощаются, и организм начинает
                требовать немедленной остановки. Преодоление — вопрос чистого упрямства и силы духа.
              </p>
              <p>
                Раз в году целые мегаполисы перекрывают движение, чтобы отдать улицы бегунам.
                Уникальный шанс увидеть город без машин: пробежать по мосту Верразано в Нью-Йорке
                или мимо Бранденбургских ворот в Берлине.
              </p>
            </div>
          </div>
        </div>

        <CountdownBar />
      </div>
    </>
  )
}

export default withAuth(HomePage)
