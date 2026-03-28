import { NextRequest, NextResponse } from 'next/server';
import { getAdminContext } from '../../_shared';

const DEFAULT_LIMIT = 5000;
const MAX_LIMIT = 20000;

type EventRow = {
  id: number;
  created_at: string;
  booking_id: number | null;
  event_type: string;
  staff_user_id: string;
  previous_staff_user_id: string | null;
  completed_at: string | null;
  booking_status: string | null;
  staff_first_name: string | null;
  staff_surname: string | null;
  staff_email: string | null;
  staff_phone: string | null;
  staff_location: string | null;
  booking_snapshot: Record<string, unknown>;
  metadata: Record<string, unknown>;
};

type StaffGroup = {
  staff_user_id: string;
  staff_name: string;
  staff_email: string;
  staff_aliases: string[];
  events: EventRow[];
};

const csvHeaders = [
  'id',
  'created_at',
  'booking_id',
  'event_type',
  'staff_user_id',
  'previous_staff_user_id',
  'completed_at',
  'booking_status',
  'staff_first_name',
  'staff_surname',
  'staff_email',
  'staff_phone',
  'staff_location',
  'booking_snapshot',
  'metadata',
];

const excelColumns: Array<{ key: keyof EventRow; label: string; width: number }> = [
  { key: 'id', label: 'Event ID', width: 70 },
  { key: 'created_at', label: 'Captured At', width: 150 },
  { key: 'booking_id', label: 'Booking ID', width: 90 },
  { key: 'event_type', label: 'Event Type', width: 95 },
  { key: 'staff_user_id', label: 'Staff User ID', width: 230 },
  { key: 'previous_staff_user_id', label: 'Previous Staff User ID', width: 230 },
  { key: 'completed_at', label: 'Completed At', width: 150 },
  { key: 'booking_status', label: 'Booking Status', width: 100 },
  { key: 'staff_first_name', label: 'Staff First Name', width: 110 },
  { key: 'staff_surname', label: 'Staff Surname', width: 110 },
  { key: 'staff_email', label: 'Staff Email', width: 220 },
  { key: 'staff_phone', label: 'Staff Phone', width: 120 },
  { key: 'staff_location', label: 'Staff Location', width: 160 },
  { key: 'booking_snapshot', label: 'Booking Snapshot', width: 380 },
  { key: 'metadata', label: 'Metadata', width: 260 },
];

const escapeCsvCell = (value: unknown) => {
  const normalized = value == null ? '' : String(value);
  return `"${normalized.replace(/"/g, '""')}"`;
};

const buildStaffGroups = (rows: EventRow[]): StaffGroup[] => {
  const map = new Map<string, StaffGroup>();

  rows.forEach((row) => {
    const firstName = String(row.staff_first_name || '').trim();
    const surname = String(row.staff_surname || '').trim();
    const displayName = `${firstName} ${surname}`.trim() || `Unknown Staff (${row.staff_user_id})`;
    const displayEmail = String(row.staff_email || '').trim();

    if (!map.has(row.staff_user_id)) {
      map.set(row.staff_user_id, {
        staff_user_id: row.staff_user_id,
        staff_name: displayName,
        staff_email: displayEmail,
        staff_aliases: displayName ? [displayName] : [],
        events: [],
      });
    }

    const group = map.get(row.staff_user_id)!;
    group.events.push(row);
    if (displayName && !group.staff_aliases.includes(displayName)) {
      group.staff_aliases.push(displayName);
    }
    if (!group.staff_email && displayEmail) {
      group.staff_email = displayEmail;
    }
  });

  const groups = Array.from(map.values())
    .map((group) => ({
      ...group,
      staff_name: group.staff_aliases[group.staff_aliases.length - 1] || group.staff_name,
      events: [...group.events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    }))
    .sort((a, b) => a.staff_name.localeCompare(b.staff_name));

  return groups;
};

const toCsv = (groups: StaffGroup[]) => {
  if (!groups.length) {
    return `${csvHeaders.join(',')}\n`;
  }

  const sections = groups.map((group) => {
    const completedCount = group.events.filter((event) => event.event_type === 'completed').length;
    const aliasLabel = group.staff_aliases.length > 1 ? group.staff_aliases.join(' -> ') : group.staff_aliases[0] || group.staff_name;
    const headerLine = [
      `Staff Name History: ${aliasLabel}`,
      `Email: ${group.staff_email || 'N/A'}`,
      `Staff ID: ${group.staff_user_id}`,
      `Total events: ${group.events.length}`,
      `Completed jobs: ${completedCount}`,
    ]
      .map(escapeCsvCell)
      .join(',');

    const dataLines = group.events.map((row) =>
      csvHeaders
        .map((header) => {
          if (header === 'booking_snapshot') {
            return escapeCsvCell(JSON.stringify(row.booking_snapshot || {}));
          }
          if (header === 'metadata') {
            return escapeCsvCell(JSON.stringify(row.metadata || {}));
          }

          const key = header as keyof EventRow;
          return escapeCsvCell(row[key]);
        })
        .join(',')
    );

    return `${headerLine}\n${csvHeaders.join(',')}\n${dataLines.join('\n')}\n`;
  });

  return sections.join('\n');
};

const escapeXml = (value: unknown) => {
  const normalized = value == null ? '' : String(value);
  return normalized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

const toStyledExcelXml = (groups: StaffGroup[], generatedAtIso: string) => {
  const headerRow = excelColumns
    .map((column) => `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(column.label)}</Data></Cell>`)
    .join('');

  const groupedRows = groups
    .map((group) => {
      const completedCount = group.events.filter((event) => event.event_type === 'completed').length;
      const aliasLabel = group.staff_aliases.length > 1 ? group.staff_aliases.join(' -> ') : group.staff_aliases[0] || group.staff_name;
      const groupTitle = `<Row>
    <Cell ss:MergeAcross="${excelColumns.length - 1}" ss:StyleID="GroupTitle"><Data ss:Type="String">${escapeXml(
      `${aliasLabel} (${group.staff_email || 'No email'})`
    )}</Data></Cell>
   </Row>`;

      const groupMeta = `<Row>
    <Cell ss:MergeAcross="${excelColumns.length - 1}" ss:StyleID="GroupMeta"><Data ss:Type="String">${escapeXml(
      `Staff ID: ${group.staff_user_id} | Events: ${group.events.length} | Completed: ${completedCount}`
    )}</Data></Cell>
   </Row>`;

      const dataRows = group.events
        .map((row, index) => {
          const styleId = index % 2 === 0 ? 'RowEven' : 'RowOdd';
          const cells = excelColumns
            .map((column) => {
              const value =
                column.key === 'booking_snapshot'
                  ? JSON.stringify(row.booking_snapshot || {})
                  : column.key === 'metadata'
                  ? JSON.stringify(row.metadata || {})
                  : row[column.key];
              return `<Cell ss:StyleID="${styleId}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
            })
            .join('');

          return `<Row>${cells}</Row>`;
        })
        .join('');

      return `${groupTitle}\n${groupMeta}\n<Row>${headerRow}</Row>\n${dataRows}\n<Row/>`;
    })
    .join('');

  const widthColumns = excelColumns
    .map((column) => `<Column ss:AutoFitWidth="0" ss:Width="${column.width}"/>`)
    .join('');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Title">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Font ss:Bold="1" ss:Size="13" ss:Color="#0f172a"/>
  </Style>
  <Style ss:ID="SubTitle">
   <Font ss:Italic="1" ss:Color="#475569"/>
  </Style>
  <Style ss:ID="GroupTitle">
   <Font ss:Bold="1" ss:Color="#0f172a"/>
   <Interior ss:Color="#e2e8f0" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="GroupMeta">
   <Font ss:Italic="1" ss:Color="#334155"/>
   <Interior ss:Color="#f1f5f9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Header">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Font ss:Bold="1" ss:Color="#ffffff"/>
   <Interior ss:Color="#1d4ed8" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93c5fd"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93c5fd"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93c5fd"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#93c5fd"/>
   </Borders>
  </Style>
  <Style ss:ID="RowEven">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Interior ss:Color="#f8fafc" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#dbeafe"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#dbeafe"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#dbeafe"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#dbeafe"/>
   </Borders>
  </Style>
  <Style ss:ID="RowOdd">
   <Alignment ss:Vertical="Top" ss:WrapText="1"/>
   <Interior ss:Color="#eff6ff" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#dbeafe"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#dbeafe"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#dbeafe"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#dbeafe"/>
   </Borders>
  </Style>
 </Styles>
 <Worksheet ss:Name="Staff History">
  <Table ss:ExpandedColumnCount="${excelColumns.length}" ss:DefaultRowHeight="16">
   ${widthColumns}
   <Row>
    <Cell ss:MergeAcross="${excelColumns.length - 1}" ss:StyleID="Title"><Data ss:Type="String">SlickTech Staff Audit Trail Report</Data></Cell>
   </Row>
   <Row>
    <Cell ss:MergeAcross="${excelColumns.length - 1}" ss:StyleID="SubTitle"><Data ss:Type="String">Generated: ${escapeXml(generatedAtIso)}</Data></Cell>
   </Row>
   <Row/>
    ${groupedRows}
  </Table>
 </Worksheet>
</Workbook>`;
};

export async function GET(req: NextRequest) {
  try {
    const context = await getAdminContext(req);
    if ('error' in context) return context.error;

    const { supabaseAdmin, requester } = context;
    const { searchParams } = new URL(req.url);

    const staffId = (searchParams.get('staffId') || '').trim();
    const eventType = (searchParams.get('eventType') || '').trim();
    const formatParam = (searchParams.get('format') || 'csv').trim().toLowerCase();
    const format = formatParam === 'json' ? 'json' : formatParam === 'xlsx' ? 'xlsx' : 'csv';
    const saveDocument = (searchParams.get('saveDocument') || 'false').trim().toLowerCase() === 'true';

    const limitParam = Number(searchParams.get('limit') || DEFAULT_LIMIT);
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(MAX_LIMIT, Math.floor(limitParam)))
      : DEFAULT_LIMIT;

    let query = supabaseAdmin
      .from('staff_job_audit')
      .select(
        'id, created_at, booking_id, event_type, staff_user_id, previous_staff_user_id, completed_at, booking_status, staff_first_name, staff_surname, staff_email, staff_phone, staff_location, booking_snapshot, metadata'
      )
      .order('created_at', { ascending: false })
      .limit(limit);

    if (staffId) {
      query = query.eq('staff_user_id', staffId);
    }

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to export staff history.' }, { status: 500 });
    }

    const events = ((data || []) as EventRow[]).map((row) => ({
      ...row,
      booking_snapshot: row.booking_snapshot || {},
      metadata: row.metadata || {},
    }));
    const groups = buildStaffGroups(events);

    const stamp = new Date().toISOString().slice(0, 10);
    const fileBase = staffId ? `staff-history-${staffId}-${stamp}` : `staff-history-${stamp}`;

    if (format === 'json') {
      const payload = {
        generated_at: new Date().toISOString(),
        generated_by_user_id: requester.id,
        filters: {
          staffId: staffId || null,
          eventType: eventType || null,
          limit,
        },
        groups,
        events,
      };

      let documentRecord: { id: number } | null = null;

      if (saveDocument) {
        const { data: docRow, error: docError } = await supabaseAdmin
          .from('staff_audit_documents')
          .insert([
            {
              generated_by_user_id: requester.id,
              title: `Staff History ${stamp}`,
              format: 'json',
              filters: {
                staffId: staffId || null,
                eventType: eventType || null,
                limit,
              },
              payload_json: payload,
            },
          ])
          .select('id')
          .single();

        if (docError) {
          return NextResponse.json({ error: docError.message || 'Failed to store JSON document.' }, { status: 500 });
        }

        documentRecord = docRow;
      }

      return NextResponse.json({
        ...payload,
        document_id: documentRecord?.id || null,
      });
    }

    const generatedAt = new Date().toISOString();
    const csv = toCsv(groups);
    const excelXml = toStyledExcelXml(groups, generatedAt);
    const exportText = format === 'xlsx' ? excelXml : csv;
    let documentRecord: { id: number } | null = null;

    if (saveDocument) {
      const { data: docRow, error: docError } = await supabaseAdmin
        .from('staff_audit_documents')
        .insert([
          {
            generated_by_user_id: requester.id,
            title: `Staff History ${stamp}`,
            format,
            filters: {
              staffId: staffId || null,
              eventType: eventType || null,
              limit,
            },
            payload_text: exportText,
          },
        ])
        .select('id')
        .single();

      if (docError) {
        return NextResponse.json({ error: docError.message || 'Failed to store export document.' }, { status: 500 });
      }

      documentRecord = docRow;
    }

    const isExcel = format === 'xlsx';
    const response = new NextResponse(exportText, {
      status: 200,
      headers: {
        'Content-Type': isExcel ? 'application/vnd.ms-excel; charset=utf-8' : 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileBase}.${isExcel ? 'xls' : 'csv'}"`,
        'Cache-Control': 'no-store',
      },
    });

    if (documentRecord?.id) {
      response.headers.set('x-staff-history-document-id', String(documentRecord.id));
    }

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to export staff history.', details: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
