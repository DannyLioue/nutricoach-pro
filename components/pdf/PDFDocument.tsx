import {
  Document,
  Page,
  StyleSheet,
  View,
  Text,
} from '@react-pdf/renderer';

interface PDFDocumentProps {
  children: React.ReactNode;
  title: string;
  clientName?: string;
  date?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Noto Sans SC',
    backgroundColor: '#FFFFFF',
    fontSize: 12,
    flexDirection: 'column',
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 5,
    fontFamily: 'Noto Sans SC',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Noto Sans SC',
  },
  content: {
    flex: 1,
    fontFamily: 'Noto Sans SC',
    width: '100%',
  },
});

export function PDFTemplate({ children, title, clientName, date }: PDFDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {clientName && <Text style={styles.subtitle}>客户: {clientName}</Text>}
          {date && <Text style={styles.subtitle}>生成日期: {date}</Text>}
        </View>
        <View style={styles.content}>
          {children}
        </View>
      </Page>
    </Document>
  );
}
