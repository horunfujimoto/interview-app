import { Badge, Button, Checkbox, Input, Message, Select, Title } from '@/atoms';
import { Breadcrumb, Card, FormField, InputGroup, Modal, Pagination, Table } from '@/molecules';
import { Alert, Container, Form, Stack, InputGroup as BootstrapInputGroup } from 'react-bootstrap';
import { ArrowRight, CheckCircle, Save, Mail, Lock } from 'lucide-react';
import { useState } from 'react';

const selectOptions = [
  { value: '1', label: 'Option 1' },
  { value: '2', label: 'Option 2' },
  { value: '3', label: 'Option 3' },
];

const tableItems = [
    { id: 1, firstName: 'Mark', lastName: 'Otto', handle: '@mdo' },
    { id: 2, firstName: 'Jacob', lastName: 'Thornton', handle: '@fat' },
    { id: 3, firstName: 'Larry the Bird', lastName: '', handle: '@twitter' },
];

function App() {
  const [showModal, setShowModal] = useState(false);
  const [isButtonLoading, setIsButtonLoading] = useState(false); // New state for button loading

  const handleLoadingButtonClick = () => {
    setIsButtonLoading(true);
    setTimeout(() => {
      setIsButtonLoading(false);
    }, 2000); // Simulate a 2-second loading time
  };

  return (
    <Container className="p-4">
      <header className="mb-4">
        <Title level={1}>Component Test Page</Title>
        <p>This page is for testing the common components.</p>
      </header>
      <main>
        <Breadcrumb>
          <Breadcrumb.Item href="#">Home</Breadcrumb.Item>
          <Breadcrumb.Item href="#">Library</Breadcrumb.Item>
          <Breadcrumb.Item active>Data</Breadcrumb.Item>
        </Breadcrumb>
        <Stack gap={4}>
          <section>
            <Title level={2} className="mb-3">Messages</Title>
            <Stack gap={2} className="col-md-8 mx-auto">
              <Message variant="success">This is a success message.</Message>
              <Message variant="danger">This is a danger message.</Message>
              <Message variant="warning">This is a warning message.</Message>
              <Message variant="info">
                This is an info message with <Alert.Link href="#">an example link</Alert.Link>. Give it a click if you like.
              </Message>
              <Message variant="light" dismissible>
                This is a light, dismissible message.
              </Message>
            </Stack>
          </section>
          <section>
            <Title level={2} className="mb-3">Modals</Title>
            <Button onClick={() => setShowModal(true)}>Launch demo modal</Button>

            <Modal
              show={showModal}
              onHide={() => setShowModal(false)}
              title="Modal heading"
            >
              <p>Woohoo, you're reading this text in a modal!</p>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowModal(false)}>
                  Close
                </Button>
                <Button variant="primary" onClick={() => setShowModal(false)}>
                  Save Changes
                </Button>
              </Modal.Footer>
            </Modal>
          </section>
          <section>
            <Title level={2} className="mb-3">Buttons</Title>
            <Stack direction="horizontal" gap={2} className="flex-wrap">
              <Button variant="primary">Primary Button</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="success" icon={CheckCircle}>Success</Button>
              <Button variant="warning" icon={Save} iconPosition="right">Warning</Button>
              <Button variant="danger" disabled>Danger Disabled</Button>
              <Button variant="link" icon={ArrowRight} iconPosition="right">Link Button</Button>
              {/* New loading button */}
              <Button
                variant="primary"
                loading={isButtonLoading}
                loadingText="Submitting..."
                onClick={handleLoadingButtonClick}
              >
                Submit Form
              </Button>
            </Stack>
          </section>
          <section>
            <Title level={2} className="mb-3">Cards</Title>
            <Stack direction="horizontal" gap={3} className="align-items-start flex-wrap">
              <Card style={{ width: '18rem' }}>
                <Card.Header>Featured</Card.Header>
                <Card.Body>
                  <Card.Title>Card Title</Card.Title>
                  <Card.Text>
                    Some quick example text to build on the card title and make up the
                    bulk of the card's content.
                  </Card.Text>
                  <Button variant="primary">Go somewhere</Button>
                </Card.Body>
                <Card.Footer>2 days ago</Card.Footer>
              </Card>
              <Card style={{ width: '18rem' }}>
                <Card.Body>
                  <Card.Title>Another Card</Card.Title>
                  <Card.Text>
                    This card has no header or footer. Just a body.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Stack>
          </section>
          <section>
            <Title level={2} className="mb-3">Tables</Title>
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                  <th>Username</th>
                </tr>
              </thead>
              <tbody>
                {tableItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.firstName}</td>
                    <td>{item.lastName}</td>
                    <td>{item.handle}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination className="justify-content-center mt-3">
              <Pagination.First />
              <Pagination.Prev />
              <Pagination.Item>{1}</Pagination.Item>
              <Pagination.Ellipsis />

              <Pagination.Item>{10}</Pagination.Item>
              <Pagination.Item>{11}</Pagination.Item>
              <Pagination.Item active>{12}</Pagination.Item>
              <Pagination.Item>{13}</Pagination.Item>
              <Pagination.Item disabled>{14}</Pagination.Item>

              <Pagination.Ellipsis />
              <Pagination.Item>{20}</Pagination.Item>
              <Pagination.Next />
              <Pagination.Last />
            </Pagination>
          </section>
          <section>
            <Title level={2} className="mb-3">Form Fields</Title>
            <Stack gap={3} className="col-md-5 mx-auto">
              <FormField
                controlId="formName"
                label="Your Name"
                type="text"
                placeholder="Enter your name"
                description="This is how we will address you."
              />
              <FormField
                controlId="formEmail"
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                error="Please provide a valid email."
              />
               <FormField
                controlId="formPassword"
                label="Password"
                type="password"
                placeholder="Enter a secure password"
              />
              <FormField
                controlId="formSelect"
                label="Select an option"
                as={Select}
                options={selectOptions}
              />
              <Form.Group>
                <Form.Label>Checkboxes</Form.Label>
                <Checkbox id="form-check-1" label="Standard checkbox" />
                <Checkbox id="form-check-2" label="Checked checkbox" defaultChecked />
              </Form.Group>
            </Stack>
          </section>
          {/* New Input Group Section */}
          <section>
            <Title level={2} className="mb-3">Input Groups</Title>
            <Stack gap={3} className="col-md-5 mx-auto">
              <InputGroup icon={Mail} inputProps={{ type: 'email', placeholder: 'Email' }} />
              <InputGroup icon={Lock} inputProps={{ type: 'password', placeholder: 'Password' }} />
              <InputGroup icon={ArrowRight} iconPosition="right" inputProps={{ type: 'text', placeholder: 'Search' }} />
              <InputGroup>
                <BootstrapInputGroup.Text>@</BootstrapInputGroup.Text>
                <Input type="text" placeholder="Username" />
              </InputGroup>
            </Stack>
          </section>
          <section>
            <Title level={2} className="mb-3">Checkboxes &amp; Radios (Raw)</Title>
            <Form className="col-md-5 mx-auto">
              <Stack gap={2}>
                <Checkbox id="check-1" label="Standard checkbox" />
                <Checkbox id="check-2" label="Disabled checkbox" disabled />
                <Checkbox id="check-3" label="Checked checkbox" defaultChecked />
              </Stack>
              <hr />
              <Stack gap={2}>
                <Checkbox name="radio-group" type="radio" id="radio-1" label="First radio" />
                <Checkbox name="radio-group" type="radio" id="radio-2" label="Second radio" />
                <Checkbox name="radio-group" type="radio" id="radio-3" label="Disabled radio" disabled />
              </Stack>
            </Form>
          </section>
          <section>
            <Title level={2} className="mb-3">Inputs (Raw)</Title>
            <Stack gap={2} className="col-md-5 mx-auto">
              <Input type="text" placeholder="Standard Input" />
              <Select options={selectOptions} />
              <Input as="textarea" rows={3} placeholder="Textarea" />
            </Stack>
          </section>
          <section>
            <Title level={2} className="mb-3">Titles</Title>
            <Stack gap={2}>
              <Title level={1}>Heading 1</Title>
              <Title level={2}>Heading 2</Title>
              <Title level={3}>Heading 3</Title>
              <Title level={4}>Heading 4</Title>
              <Title level={5}>Heading 5</Title>
              <Title level={6}>Heading 6</Title>
            </Stack>
          </section>
          <section>
            <Title level={2} className="mb-3">Badges</Title>
            <Stack direction="horizontal" gap={2}>
              <Badge bg="primary">Primary</Badge>
              <Badge bg="secondary">Secondary</Badge>
              <Badge bg="success">Success</Badge>
              <Badge bg="danger">Danger</Badge>
              <Badge bg="warning" text="dark">Warning</Badge>
              <Badge bg="info">Info</Badge>
              <Badge bg="light" text="dark">Light</Badge>
              <Badge bg="dark">Dark</Badge>
            </Stack>
          </section>
        </Stack>
      </main>
    </Container>
  );
}

export default App;
